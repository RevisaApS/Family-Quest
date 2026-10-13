import type { Language } from '@/lib/ai/language'
import type { StorySegment } from '@/lib/ai/segments'

// The browser half of read-aloud mode. It sends one text at a time to
// /api/ai/narrate and plays the PCM back with Web Audio while it is still
// arriving: each chunk becomes an AudioBuffer scheduled to start exactly where
// the previous one ends, so the voice runs on without gaps.
//
// Downloading and playing are kept apart. A download fills a buffer and, once
// complete, stays in memory; playing reads from it, from the start, as fast
// as it fills. So Replay never costs a request while audio is in memory or
// still arriving, and stopping the voice never throws away a paid request.
//
// iPad Safari only lets audio start after a tap, so unlock() must run inside
// the tap handler before anything is awaited. Audio that arrives while the
// context is still locked waits, and plays from the start on the next tap.

export type NarrationKind = 'scene' | 'options' | 'outcome' | 'epilogue' | 'hook'

export interface NarrationItem {
  id: string
  kind: NarrationKind
  segments: StorySegment[]
  language: Language
}

export interface NarratorSnapshot {
  status: 'idle' | 'loading' | 'playing'
  currentId: string | null
  // The last narration that failed; `at` tells one failure from the next
  error: { id: string; at: number } | null
  // Bumped whenever finished audio is stored
  cacheVersion: number
}

export const IDLE_SNAPSHOT: NarratorSnapshot = { status: 'idle', currentId: null, error: null, cacheVersion: 0 }

export interface NarratorTimings {
  // The server waits for Google's first audio before answering (that is where
  // the fallback model gets its chance), so allow for two slow starts.
  firstByteTimeoutMs: number
  // No new audio for this long mid-stream: give up and let the family read
  stallTimeoutMs: number
  // How often a waiting item checks that its audio is still being heard
  drainPollMs: number
  // A running audio clock that stops moving this long is dead
  stuckClockMs: number
  // Audio waiting for a tap that never comes stops holding up the queue
  lockedWaitMs: number
  // After Google's daily cap answers 429, the narrator rests this long
  coolDownMs: number
}

const DEFAULT_TIMINGS: NarratorTimings = {
  firstByteTimeoutMs: 20_000,
  stallTimeoutMs: 12_000,
  drainPollMs: 500,
  stuckClockMs: 3_000,
  lockedWaitMs: 120_000,
  coolDownMs: 30 * 60_000,
}

// Small chunks are gathered into buffers of at least this much audio
const MIN_CHUNK_SECONDS = 0.25
// Head start for the first buffer, so it never starts in the past
const START_LEAD_SECONDS = 0.12
// About 1.4 MB per 30 seconds of audio; a dozen covers a whole evening's replays
const CACHE_LIMIT = 12
// Survives a reload, not the browser tab
const BLOCK_KEY = 'family-quest-narrator-blocked-until'

// --- Pure helpers (unit-tested) ----------------------------------------------

// FNV-1a, enough to tell two texts apart without storing them
export function hashString(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

// The same text always gets the same id, so its audio is fetched only once
export function narrationId(kind: NarrationKind, segments: StorySegment[], language: Language): string {
  return `${kind}:${hashString(language + JSON.stringify(segments))}`
}

export function sampleRateFromContentType(contentType: string | null): number {
  const match = /rate=(\d+)/i.exec(contentType ?? '')
  return match ? Number(match[1]) : 24000
}

// 16-bit little-endian PCM to the -1..1 floats Web Audio plays
export function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const samples = new Float32Array(Math.floor(bytes.byteLength / 2))
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768
  return samples
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

// Network chunks split anywhere, even through the middle of a sample. This
// gathers them into even-length pieces of at least `minBytes`.
export class PcmAssembler {
  private pending: Uint8Array[] = []
  private pendingBytes = 0

  constructor(private readonly minBytes: number) {}

  push(bytes: Uint8Array): Uint8Array[] {
    this.pending.push(bytes)
    this.pendingBytes += bytes.byteLength
    if (this.pendingBytes < this.minBytes) return []
    return this.take(false)
  }

  // Everything left at the end of the stream (a stray odd byte is dropped)
  flush(): Uint8Array | null {
    return this.take(true)[0] ?? null
  }

  private take(final: boolean): Uint8Array[] {
    const all = concatBytes(this.pending)
    const even = all.byteLength - (all.byteLength % 2)
    this.pending = !final && even < all.byteLength ? [all.subarray(even)] : []
    this.pendingBytes = this.pending.reduce((n, c) => n + c.byteLength, 0)
    return even > 0 ? [all.subarray(0, even)] : []
  }
}

// --- The player --------------------------------------------------------------

// A failure the family has already been told about, or one nobody needs to
// hear about (the page was hidden, the narrator is resting): no new note.
class QuietError extends Error {}

interface Download {
  id: string
  chunks: Uint8Array[]
  rate: number
  state: 'loading' | 'done' | 'failed'
  error?: unknown
  controller: AbortController
  waiters: Set<() => void>
}

type IOSAudioSession = { type?: string }

export class Narrator {
  private readonly timings: NarratorTimings
  private ctx: AudioContext | null = null
  // Set when resuming failed or the system left the context interrupted: the
  // next tap builds a fresh context instead
  private ctxBroken = false
  private paused = false
  private queue: NarrationItem[] = []
  private current: { item: NarrationItem; abort: AbortController } | null = null
  private sources = new Set<AudioBufferSourceNode>()
  private playhead = 0
  private drained: (() => void) | null = null
  // In flight and finished audio by id; the finished ones are the cache
  private downloads = new Map<string, Download>()
  private listeners = new Set<() => void>()
  private snapshot: NarratorSnapshot = IDLE_SNAPSHOT
  private pumping = false
  private blockedUntilMs: number | null = null
  private watchingVisibility = false

  constructor(timings: Partial<NarratorTimings> = {}) {
    this.timings = { ...DEFAULT_TIMINGS, ...timings }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  getSnapshot = (): NarratorSnapshot => this.snapshot

  private update(partial: Partial<NarratorSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial }
    for (const listener of this.listeners) listener()
  }

  // --- Audio context ---

  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      const ctx = new Ctor()
      ctx.onstatechange = () => this.onContextState(ctx)
      this.ctx = ctx
      this.ctxBroken = false
      if (this.paused) void ctx.suspend().catch(() => {})
    }
    return this.ctx
  }

  private onContextState(ctx: AudioContext) {
    if (ctx !== this.ctx) return
    const state = ctx.state as string
    if (state === 'running') this.ctxBroken = false
    // A phone call or the lock screen took the audio away. iPadOS often will
    // not resume such a context, so the next tap builds a new one.
    else if (state === 'interrupted' || state === 'closed') this.ctxBroken = true
  }

  // With the iPad's silent switch on, Web Audio is muted unless the page asks
  // for "playback" audio (Safari 17 and later).
  private preferPlayback() {
    try {
      const session = (navigator as Navigator & { audioSession?: IOSAudioSession }).audioSession
      if (session && session.type !== 'playback') session.type = 'playback'
    } catch { /* not supported here */ }
  }

  private resume(ctx: AudioContext) {
    ctx.resume().then(
      () => { if (ctx === this.ctx && !this.paused && ctx.state !== 'running') this.ctxBroken = true },
      () => { if (ctx === this.ctx) this.ctxBroken = true },
    )
    // A silent one-sample buffer started inside the gesture is what finally
    // unlocks older iOS Safari
    const source = ctx.createBufferSource()
    source.buffer = ctx.createBuffer(1, 1, 22050)
    source.connect(ctx.destination)
    source.start(0)
  }

  // Throws away a context that will not come back and plays the current text
  // again, from the start, in a fresh one. Its audio is in memory or still
  // arriving, so this costs no request.
  private replaceContext() {
    const old = this.ctx
    const item = this.current?.item
    this.abortPlayback()
    if (item) this.queue.unshift(item)
    this.ctx = null
    this.ctxBroken = false
    if (old) void old.close().catch(() => {})
    void this.pump()
  }

  // Call from inside a tap handler, before any await
  unlock() {
    if (typeof window === 'undefined') return
    this.preferPlayback()
    if (this.ctx && (this.ctxBroken || (this.ctx.state as string) === 'interrupted')) this.replaceContext()
    const ctx = this.context()
    // While the game is paused, a tap (on the pause screen, say) must not
    // bring the voice back
    if (!ctx || this.paused || ctx.state === 'running') return
    this.resume(ctx)
  }

  // Pause suspends the voice exactly where it is; unpausing carries on.
  // Call it inside the tap too, so iPad Safari allows the resume.
  setPaused(paused: boolean) {
    if (this.paused === paused) return
    this.paused = paused
    const ctx = this.ctx
    if (!ctx) return
    if (paused) void ctx.suspend().catch(() => {})
    else if (ctx.state !== 'running') this.resume(ctx)
  }

  // --- Visibility ---

  private watchVisibility() {
    if (this.watchingVisibility || typeof document === 'undefined') return
    this.watchingVisibility = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.onHidden()
    })
  }

  // iPadOS freezes a hidden page, and on return every timer fires at once.
  // Stop cleanly now instead: no stall timeout, no note, and the page stays
  // replayable with "Læs igen".
  private onHidden() {
    this.queue = []
    this.abortPlayback()
    for (const download of this.downloads.values()) {
      if (download.state === 'loading') {
        download.error = new QuietError('Page hidden')
        download.controller.abort()
      }
    }
  }

  // --- The daily cap ---

  private blockedUntil(): number {
    if (this.blockedUntilMs === null) {
      try {
        this.blockedUntilMs = Number(sessionStorage.getItem(BLOCK_KEY)) || 0
      } catch {
        this.blockedUntilMs = 0
      }
    }
    return this.blockedUntilMs
  }

  isResting(): boolean {
    return Date.now() < this.blockedUntil()
  }

  // Google said 429 even on the fallback model: rest for a while, tell the
  // family once, and keep playing whatever is already in memory.
  private rest(id: string) {
    if (this.isResting()) return
    this.blockedUntilMs = Date.now() + this.timings.coolDownMs
    try { sessionStorage.setItem(BLOCK_KEY, String(this.blockedUntilMs)) } catch { /* private mode */ }
    this.update({ error: { id, at: Date.now() } })
  }

  // --- Queue ---

  has(id: string): boolean {
    return this.downloads.get(id)?.state === 'done'
  }

  // Queue a text. A newer text of the same kind replaces an older one, playing
  // or waiting: a rerolled outcome replaces the first, a new page the old.
  say(item: NarrationItem) {
    this.watchVisibility()
    this.queue = this.queue.filter(q => q.kind !== item.kind)
    if (this.current?.item.kind === item.kind) this.abortPlayback()
    this.queue.push(item)
    void this.pump()
  }

  // Read these again from the start, in order. Audio in memory or still
  // arriving is reused; anything else (a failed or cut-off narration) is
  // requested again, unless the narrator is resting.
  replay(items: NarrationItem[]) {
    if (items.length === 0) return
    this.watchVisibility()
    const kinds = new Set(items.map(i => i.kind))
    this.queue = this.queue.filter(q => !kinds.has(q.kind))
    this.abortPlayback()
    this.queue.unshift(...items)
    void this.pump()
  }

  // Drop a kind, playing or waiting: the family has moved on from it
  cancel(kind: NarrationKind) {
    this.queue = this.queue.filter(q => q.kind !== kind)
    if (this.current?.item.kind === kind) this.abortPlayback()
  }

  // Silence now and forget the queue. Downloads finish quietly into memory.
  stop() {
    this.queue = []
    this.abortPlayback()
    if (this.snapshot.error) this.update({ error: null })
  }

  private stopSources() {
    for (const source of this.sources) {
      try { source.stop() } catch { /* already stopped */ }
    }
    this.sources.clear()
    // The next text starts now, not where the stopped one would have ended
    this.playhead = 0
  }

  private abortPlayback() {
    this.current?.abort.abort()
    this.stopSources()
    this.drained?.()
  }

  private async pump() {
    if (this.pumping) return
    this.pumping = true
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()!
        const abort = new AbortController()
        this.current = { item, abort }
        this.update({ status: 'loading', currentId: item.id })
        try {
          await this.play(item, abort.signal)
        } catch (error) {
          // A broken stream stops at once rather than trailing off mid-word;
          // it was never stored, so "Læs igen" asks for it again
          if (!abort.signal.aborted) this.stopSources()
          if (!abort.signal.aborted && !(error instanceof QuietError)) {
            console.warn('Narrator failed:', error instanceof Error ? error.message : error)
            this.update({ error: { id: item.id, at: Date.now() } })
          }
        } finally {
          this.current = null
        }
      }
    } finally {
      this.pumping = false
      this.update({ status: 'idle', currentId: null })
    }
  }

  // --- Downloading ---

  private download(item: NarrationItem): Download {
    const existing = this.downloads.get(item.id)
    if (existing) {
      if (existing.state === 'done') {
        // Most recently used goes to the back of the line
        this.downloads.delete(item.id)
        this.downloads.set(item.id, existing)
      }
      return existing
    }
    if (this.isResting()) throw new QuietError('The narrator is resting')
    const download: Download = {
      id: item.id, chunks: [], rate: 24000, state: 'loading',
      controller: new AbortController(), waiters: new Set(),
    }
    this.downloads.set(item.id, download)
    void this.fetchInto(download, item)
    return download
  }

  private wake(download: Download) {
    for (const waiter of download.waiters) waiter()
    download.waiters.clear()
  }

  private async fetchInto(download: Download, item: NarrationItem) {
    const abort = () => download.controller.abort()
    let timer = setTimeout(abort, this.timings.firstByteTimeoutMs)
    try {
      const response = await fetch('/api/ai/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: item.segments, language: item.language }),
        signal: download.controller.signal,
      })
      if (response.status === 429) {
        this.rest(item.id)
        throw new QuietError('Narrator answered 429')
      }
      if (!response.ok || !response.body) throw new Error(`Narrate answered ${response.status}`)
      download.rate = sampleRateFromContentType(response.headers.get('content-type'))
      const reader = response.body.getReader()
      while (true) {
        clearTimeout(timer)
        timer = setTimeout(abort, this.timings.stallTimeoutMs)
        const { value, done } = await reader.read()
        if (done) break
        download.chunks.push(value)
        this.wake(download)
      }
      download.state = 'done'
      this.trimCache()
      this.update({ cacheVersion: this.snapshot.cacheVersion + 1 })
    } catch (error) {
      download.state = 'failed'
      download.error ??= error
      // Only complete audio is kept: the next request for this text tries again
      if (this.downloads.get(download.id) === download) this.downloads.delete(download.id)
    } finally {
      clearTimeout(timer)
      this.wake(download)
    }
  }

  private trimCache() {
    const done = [...this.downloads.values()].filter(d => d.state === 'done')
    for (const old of done.slice(0, Math.max(0, done.length - CACHE_LIMIT))) this.downloads.delete(old.id)
  }

  // --- Playing ---

  private schedule(ctx: AudioContext, pcm: Uint8Array, rate: number) {
    const samples = pcm16ToFloat32(pcm)
    if (samples.length === 0) return
    const buffer = ctx.createBuffer(1, samples.length, rate)
    buffer.getChannelData(0).set(samples)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    const startAt = Math.max(this.playhead, ctx.currentTime + START_LEAD_SECONDS)
    source.start(startAt)
    this.playhead = startAt + buffer.duration
    this.sources.add(source)
    source.onended = () => {
      // A source stopped by stopSources() was already let go
      if (!this.sources.delete(source)) return
      if (this.sources.size === 0) this.drained?.()
    }
    if (this.snapshot.status !== 'playing') this.update({ status: 'playing' })
  }

  private nextData(download: Download, signal: AbortSignal): Promise<void> {
    return new Promise(resolve => {
      const done = () => { signal.removeEventListener('abort', done); resolve() }
      download.waiters.add(done)
      signal.addEventListener('abort', done, { once: true })
    })
  }

  // Resolves once everything scheduled has been heard, or on abort. A context
  // whose clock has stopped, or audio still waiting for a tap after a long
  // while, gives up so the queue never hangs. Pause waits as long as it takes.
  private untilDrained(signal: AbortSignal): Promise<void> {
    if (this.sources.size === 0 || signal.aborted) return Promise.resolve()
    return new Promise(resolve => {
      let lastClock = -1
      let stuckMs = 0
      let lockedMs = 0
      const finish = () => {
        clearInterval(timer)
        signal.removeEventListener('abort', finish)
        if (this.drained === finish) this.drained = null
        resolve()
      }
      this.drained = finish
      signal.addEventListener('abort', finish, { once: true })
      const timer = setInterval(() => {
        const ctx = this.ctx
        if (this.sources.size === 0 || !ctx) return finish()
        if (this.paused) return
        const step = this.timings.drainPollMs
        if (ctx.state === 'running') {
          stuckMs = ctx.currentTime === lastClock ? stuckMs + step : 0
          lastClock = ctx.currentTime
          if (stuckMs >= this.timings.stuckClockMs) this.ctxBroken = true
          if (stuckMs >= this.timings.stuckClockMs || ctx.currentTime > this.playhead + 2) {
            this.stopSources()
            finish()
          }
        } else if ((lockedMs += step) >= this.timings.lockedWaitMs) {
          this.stopSources()
          finish()
        }
      }, this.timings.drainPollMs)
    })
  }

  private async play(item: NarrationItem, signal: AbortSignal) {
    const ctx = this.context()
    if (!ctx) throw new Error('Web Audio is not available')
    const download = this.download(item)
    // Audio already complete plays as one buffer; streaming audio in pieces
    const minBytes = download.state === 'done' ? Infinity : Math.round(download.rate * 2 * MIN_CHUNK_SECONDS)
    const assembler = new PcmAssembler(minBytes)
    let index = 0
    while (!signal.aborted) {
      while (index < download.chunks.length) {
        for (const piece of assembler.push(download.chunks[index++])) this.schedule(ctx, piece, download.rate)
      }
      if (download.state === 'done') break
      if (download.state === 'failed') throw download.error
      await this.nextData(download, signal)
    }
    if (signal.aborted) return
    const rest = assembler.flush()
    if (rest) this.schedule(ctx, rest, download.rate)
    await this.untilDrained(signal)
  }
}

export const narrator = new Narrator()

export function unlockNarrator() {
  narrator.unlock()
}

export function pauseNarrator(paused: boolean) {
  narrator.setPaused(paused)
}
