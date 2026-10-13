import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  Narrator, PcmAssembler, concatBytes, hashString, narrationId, pcm16ToFloat32, sampleRateFromContentType,
} from '@/lib/narrator'
import { narratorOnly } from '@/lib/ai/segments'

describe('PCM helpers', () => {
  it('turns 16-bit little-endian samples into -1..1 floats', () => {
    // 0, 16384 (0.5), -32768 (-1), 32767 (just under 1)
    const samples = pcm16ToFloat32(new Uint8Array([0x00, 0x00, 0x00, 0x40, 0x00, 0x80, 0xff, 0x7f]))
    expect([...samples.slice(0, 3)]).toEqual([0, 0.5, -1])
    expect(samples[3]).toBeCloseTo(1, 3)
  })

  it('reads the sample rate from the response type', () => {
    expect(sampleRateFromContentType('audio/L16; rate=24000; channels=1')).toBe(24000)
    expect(sampleRateFromContentType(null)).toBe(24000)
  })

  it('gathers small network chunks into even-length pieces', () => {
    const assembler = new PcmAssembler(4)
    expect(assembler.push(new Uint8Array([1, 2, 3]))).toEqual([])
    // 5 bytes pending: 4 go out, the odd byte waits for its partner
    expect(assembler.push(new Uint8Array([4, 5])).map(c => [...c])).toEqual([[1, 2, 3, 4]])
    expect(assembler.push(new Uint8Array([6, 7, 8])).map(c => [...c])).toEqual([[5, 6, 7, 8]])
    expect(assembler.flush()).toBeNull()
  })

  it('flushes what is left at the end, dropping a stray odd byte', () => {
    const assembler = new PcmAssembler(100)
    assembler.push(new Uint8Array([1, 2, 3]))
    expect([...assembler.flush()!]).toEqual([1, 2])
  })

  it('concatenates chunks', () => {
    expect([...concatBytes([new Uint8Array([1]), new Uint8Array([2, 3])])]).toEqual([1, 2, 3])
  })

  it('gives the same text the same id, and different texts different ids', () => {
    const a = narrationId('scene', narratorOnly('Porten knirker.'), 'da')
    expect(narrationId('scene', narratorOnly('Porten knirker.'), 'da')).toBe(a)
    expect(narrationId('scene', narratorOnly('Porten smækker.'), 'da')).not.toBe(a)
    expect(narrationId('scene', narratorOnly('Porten knirker.'), 'en')).not.toBe(a)
    expect(hashString('')).toBeTruthy()
  })
})

// A stand-in for Web Audio: buffers "play" instantly unless told otherwise
class FakeAudioContext {
  // Like iPad Safari: locked until a tap resumes it
  state: string = 'suspended'
  currentTime = 0
  destination = {}
  started: number[] = []
  // False: sources never finish, like a context whose clock has died
  endsSources = true
  onstatechange: null | (() => void) = null
  resume = vi.fn(async () => { this.setState('running') })
  suspend = vi.fn(async () => { this.setState('suspended') })
  close = vi.fn(async () => { this.setState('closed') })
  setState(state: string) {
    this.state = state
    this.onstatechange?.()
  }
  createBuffer(_channels: number, length: number, rate: number) {
    const data = new Float32Array(length)
    return { duration: length / rate, getChannelData: () => data }
  }
  createBufferSource() {
    const ctx = { started: this.started, ends: () => this.endsSources }
    const source = {
      buffer: null as unknown,
      onended: null as null | (() => void),
      stopped: false,
      connect: () => {},
      start(at: number) {
        ctx.started.push(at)
        if (ctx.ends()) setTimeout(() => source.onended?.(), 0)
      },
      stop() {
        source.stopped = true
        setTimeout(() => source.onended?.(), 0)
      },
    }
    return source
  }
}

function pcmResponse(bytes: number): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'Content-Type': 'audio/L16; rate=24000; channels=1' },
  })
}

// A response that sends some audio, then breaks mid-stream
function brokenResponse(): Response {
  let sent = false
  return new Response(new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!sent) { sent = true; controller.enqueue(new Uint8Array(24_000)) } else controller.error(new TypeError('network error'))
    },
  }), { status: 200, headers: { 'Content-Type': 'audio/L16; rate=24000; channels=1' } })
}

const until = async (check: () => boolean) => {
  for (let i = 0; i < 300 && !check(); i++) await new Promise(r => setTimeout(r, 1))
  expect(check()).toBe(true)
}

const FAST = { drainPollMs: 5, stuckClockMs: 30, lockedWaitMs: 60 }

describe('Narrator', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let contexts: FakeAudioContext[]

  beforeEach(() => {
    contexts = []
    vi.stubGlobal('AudioContext', vi.fn(function () {
      const ctx = new FakeAudioContext()
      contexts.push(ctx)
      return ctx
    }))
    fetchMock = vi.fn(async () => pcmResponse(48_000))
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const item = (kind: 'scene' | 'options' | 'outcome', text: string) => {
    const segments = narratorOnly(text)
    return { id: narrationId(kind, segments, 'da'), kind, segments, language: 'da' as const }
  }
  const idle = (narrator: Narrator) => narrator.getSnapshot().status === 'idle'

  it('fetches a text once, plays it, and replays it from memory', async () => {
    const narrator = new Narrator(FAST)
    const scene = item('scene', 'Porten knirker.')
    narrator.say(scene)
    await until(() => narrator.has(scene.id) && idle(narrator))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ segments: scene.segments, language: 'da' })
    expect(contexts[0].started.length).toBeGreaterThan(0)

    const playedBefore = contexts[0].started.length
    narrator.replay([scene])
    await until(() => contexts[0].started.length > playedBefore && idle(narrator))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('asks again on Replay when the first try failed, and keeps the result', async () => {
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 502 }))
    const narrator = new Narrator(FAST)
    const scene = item('scene', 'Porten knirker.')
    narrator.say(scene)
    await until(() => narrator.getSnapshot().error !== null && idle(narrator))
    expect(narrator.has(scene.id)).toBe(false)

    narrator.replay([scene])
    await until(() => narrator.has(scene.id) && idle(narrator))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('restarts audio that is still arriving without a second request', async () => {
    let release: () => void = () => {}
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { release = () => resolve(pcmResponse(4800)) }))
    const narrator = new Narrator(FAST)
    const scene = item('scene', 'Porten knirker.')
    narrator.say(scene)
    await until(() => fetchMock.mock.calls.length === 1)
    narrator.replay([scene])
    release()
    await until(() => narrator.has(scene.id) && idle(narrator))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('stops a stream that breaks halfway, says so, and never keeps the clip', async () => {
    fetchMock.mockImplementationOnce(async () => brokenResponse())
    const narrator = new Narrator(FAST)
    const scene = item('scene', 'Porten knirker.')
    narrator.say(scene)
    await until(() => narrator.getSnapshot().error !== null && idle(narrator))
    expect(narrator.has(scene.id)).toBe(false)
    // The part that did arrive was scheduled, then stopped
    expect(contexts[0].started.length).toBeGreaterThan(0)
  })

  it('plays one text at a time, in order', async () => {
    const order: string[] = []
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      order.push(JSON.parse(init.body as string).segments[0].text)
      return pcmResponse(4800)
    })
    const narrator = new Narrator(FAST)
    narrator.say(item('scene', 'Først scenen.'))
    narrator.say(item('options', 'Så valgene.'))
    await until(() => order.length === 2 && idle(narrator))
    expect(order).toEqual(['Først scenen.', 'Så valgene.'])
  })

  it('lets a newer text replace a waiting one of the same kind', async () => {
    const order: string[] = []
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      order.push(JSON.parse(init.body as string).segments[0].text)
      return pcmResponse(4800)
    })
    const narrator = new Narrator(FAST)
    narrator.say(item('scene', 'Scenen.'))
    narrator.say(item('outcome', 'Første udfald.'))
    narrator.say(item('outcome', 'Slået om.'))
    await until(() => idle(narrator) && order.length >= 2)
    expect(order).toEqual(['Scenen.', 'Slået om.'])
  })

  it('drops a cancelled kind, waiting or playing', async () => {
    const narrator = new Narrator(FAST)
    contexts.length = 0
    narrator.say(item('scene', 'Scenen.'))
    narrator.say(item('outcome', 'Udfaldet.'))
    narrator.cancel('outcome')
    await until(() => idle(narrator))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  describe('the daily cap', () => {
    it('rests for a while after a 429: one note, no more requests, memory still plays', async () => {
      const narrator = new Narrator(FAST)
      const first = item('scene', 'Første side.')
      narrator.say(first)
      await until(() => narrator.has(first.id) && idle(narrator))

      fetchMock.mockResolvedValue(new Response('{"error":"busy"}', { status: 429 }))
      narrator.say(item('outcome', 'Udfaldet.'))
      await until(() => narrator.getSnapshot().error !== null && idle(narrator))
      const note = narrator.getSnapshot().error
      expect(narrator.isResting()).toBe(true)
      expect(Number(sessionStorage.getItem('family-quest-narrator-blocked-until'))).toBeGreaterThan(Date.now())

      // Resting: the next texts are skipped quietly, with no second note
      narrator.say(item('scene', 'Næste side.'))
      narrator.say(item('options', 'Valgene.'))
      await until(() => idle(narrator))
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(narrator.getSnapshot().error).toBe(note)

      // Audio already in memory still plays
      const before = contexts[0].started.length
      narrator.replay([first])
      await until(() => contexts[0].started.length > before && idle(narrator))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('remembers the rest across a reload of the page', async () => {
      sessionStorage.setItem('family-quest-narrator-blocked-until', String(Date.now() + 60_000))
      const narrator = new Narrator(FAST)
      narrator.say(item('scene', 'Porten knirker.'))
      await until(() => idle(narrator))
      expect(fetchMock).not.toHaveBeenCalled()
      expect(narrator.getSnapshot().error).toBeNull()
    })
  })

  describe('pause, hidden pages and broken audio', () => {
    it('pause suspends the voice, and taps cannot bring it back until the game resumes', async () => {
      const narrator = new Narrator(FAST)
      narrator.unlock()
      const ctx = contexts[0]
      narrator.setPaused(true)
      expect(ctx.suspend).toHaveBeenCalled()
      ctx.resume.mockClear()
      narrator.unlock()
      expect(ctx.resume).not.toHaveBeenCalled()
      narrator.setPaused(false)
      expect(ctx.resume).toHaveBeenCalledTimes(1)
    })

    it('holds the queue while paused, however long the pause', async () => {
      const narrator = new Narrator(FAST)
      narrator.unlock()
      contexts[0].endsSources = false
      narrator.setPaused(true)
      narrator.say(item('scene', 'Scenen.'))
      await until(() => narrator.getSnapshot().status === 'playing')
      await new Promise(r => setTimeout(r, 120))
      expect(narrator.getSnapshot().status).toBe('playing')
    })

    it('gives up on audio whose clock has died, so the queue moves on', async () => {
      const narrator = new Narrator(FAST)
      narrator.unlock()
      contexts[0].endsSources = false
      narrator.say(item('scene', 'Scenen.'))
      narrator.say(item('outcome', 'Udfaldet.'))
      await until(() => idle(narrator))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('builds a fresh context on the next tap when the old one stays interrupted', async () => {
      const narrator = new Narrator(FAST)
      narrator.unlock()
      contexts[0].setState('interrupted')
      narrator.unlock()
      expect(contexts).toHaveLength(2)
      expect(contexts[0].close).toHaveBeenCalled()
      expect(contexts[1].resume).toHaveBeenCalled()
    })

    it('asks the iPad for playback audio, so the silent switch does not mute the story', () => {
      const audioSession = { type: 'auto' }
      vi.stubGlobal('navigator', { ...navigator, audioSession })
      new Narrator(FAST).unlock()
      expect(audioSession.type).toBe('playback')
    })

    it('stops cleanly when the page is hidden: no note, and the text stays replayable', async () => {
      fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }))
      const narrator = new Narrator(FAST)
      const scene = item('scene', 'Porten knirker.')
      narrator.say(scene)
      await until(() => fetchMock.mock.calls.length === 1)

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      await until(() => idle(narrator))
      expect(narrator.getSnapshot().error).toBeNull()

      narrator.replay([scene])
      await until(() => narrator.has(scene.id) && idle(narrator))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('stops and forgets the queue', async () => {
      let release: () => void = () => {}
      fetchMock.mockImplementation(() => new Promise<Response>(resolve => { release = () => resolve(pcmResponse(4800)) }))
      const narrator = new Narrator(FAST)
      narrator.say(item('scene', 'Scenen.'))
      narrator.say(item('outcome', 'Udfaldet.'))
      await until(() => fetchMock.mock.calls.length === 1)
      narrator.stop()
      release()
      await until(() => idle(narrator))
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(narrator.getSnapshot().error).toBeNull()
    })
  })
})
