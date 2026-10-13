import type { Language } from './language'
import type { CharacterVoice, StorySegment } from './segments'

// The narrator: one Gemini TTS request per narrated text, streamed back as raw
// PCM while it is still being generated (the first audio lands after about a
// second, and generation runs about 4x faster than playback).
//
// Google caps these models at roughly 100 requests a day each, paid tier or
// not. So: never one request per sentence, one fallback to the cheaper sibling
// on a 429 or 5xx, and never any retry beyond that. The client keeps finished
// audio in memory, so Replay costs nothing.

export const TTS_MODEL = 'gemini-3.8-flash-tts'
export const TTS_FALLBACK_MODEL = 'gemini-3.8-flash-lite-tts'

// The storyteller's voice. One constant so it is a one-line change after the
// kids vote (Achird and Algenib were the runners-up).
export const NARRATOR_VOICE = 'Charon'

// Each character voice type maps to a prebuilt voice. Picked by ear: Algenib
// is a gruff troll, Puck a squeaky goblin; the rest follow Google's traits.
export const CHARACTER_VOICE_NAMES: Record<CharacterVoice, string> = {
  gruff: 'Algenib',
  squeaky: 'Puck',
  wise: 'Gacrux',
  young: 'Leda',
  menacing: 'Orus',
  friendly: 'Achird',
}

// Used if a character's voice is the narrator's own, so the two never blur
// (Achird is both "friendly" and a narrator candidate).
const ALTERNATE_VOICE = 'Sulafat'

// How each voice type should sound. Goes in speech_metadata.style, never in
// the text: the text is spoken word for word.
const VOICE_STYLES: Record<CharacterVoice, string> = {
  gruff: 'a big gruff creature: deep, rumbling, slow and grumpy',
  squeaky: 'a small squeaky creature: high-pitched, quick and mischievous',
  wise: 'an old and wise character: slow, calm and a little creaky',
  young: 'a young character: bright, eager and quick',
  menacing: 'a dark villain: low, cold and menacing, scary in a fun way for children',
  friendly: 'a kind and friendly character: warm, cheerful and welcoming',
}

// The request has no language field and Danish drifts toward English or
// Swedish without one, so every style opens with the language direction.
const LANGUAGE_DIRECTIONS: Record<Language, string> = {
  da: 'Danish, spoken with a native Danish accent and standard Danish pronunciation; ',
  en: 'Clear, natural English; ',
}

const NARRATOR_STYLE =
  'a captivating fairy-tale storyteller reading aloud to two eight-year-old boys: lively and suspenseful, with dramatic pauses, warm but exciting'

// Speaker ids must be plain ASCII and match the speaker config exactly.
export const NARRATOR_SPEAKER = 'Fortaeller'
const CHARACTER_SPEAKER_FALLBACK = 'Figur'

// Limits on what the route will send to Google. A scene with dialogue is well
// under 1000 characters and the epilogue under 1500.
export const MAX_SEGMENTS = 30
export const MAX_SEGMENT_CHARS = 1500
export const MAX_TEXT_CHARS = 3000
// The request body, checked before it is parsed
export const MAX_BODY_CHARS = 16_000

export function languageDirection(language: Language): string {
  return LANGUAGE_DIRECTIONS[language] ?? LANGUAGE_DIRECTIONS.da
}

export function narratorStyle(language: Language): string {
  return languageDirection(language) + NARRATOR_STYLE
}

// A character with a speaker of their own
export function characterStyle(voice: CharacterVoice, name: string | undefined, language: Language): string {
  return `${languageDirection(language)}${name ? `the voice of ${name}, ` : ''}${VOICE_STYLES[voice]}`
}

// A character the narrator has to voice, because the request only has room
// for two speakers
export function narratorActingStyle(voice: CharacterVoice, name: string | undefined, language: Language): string {
  return `${languageDirection(language)}the storyteller acting out the voice of ${name ?? 'a character'}, ${VOICE_STYLES[voice]}`
}

export function characterVoiceName(voice: CharacterVoice): string {
  const name = CHARACTER_VOICE_NAMES[voice]
  return name === NARRATOR_VOICE ? ALTERNATE_VOICE : name
}

// "Trolden Grum" -> "TroldenGrum", "Fru Ærø" -> "FruAeroe"
export function speakerId(name: string | undefined): string {
  const ascii = (name ?? '')
    .replace(/æ/g, 'ae').replace(/Æ/g, 'Ae')
    .replace(/ø/g, 'oe').replace(/Ø/g, 'Oe')
    .replace(/å/g, 'aa').replace(/Å/g, 'Aa')
    .normalize('NFD')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 24)
  return ascii && ascii !== NARRATOR_SPEAKER ? ascii : CHARACTER_SPEAKER_FALLBACK
}

interface SpeechPart {
  text: string
  speech_metadata: { speaker?: string; style: string }
}

type VoiceConfig = { prebuiltVoiceConfig: { voiceName: string } }

export interface TtsRequest {
  contents: Array<{ role: 'user'; parts: SpeechPart[] }>
  generationConfig: {
    responseModalities: ['AUDIO']
    speechConfig:
      | { voiceConfig: VoiceConfig }
      | { multiSpeakerVoiceConfig: { speakerVoiceConfigs: Array<{ speaker: string; voiceConfig: VoiceConfig }> } }
  }
}

function sameCharacter(a: StorySegment, b: StorySegment): boolean {
  return a.speaker === 'character' && b.speaker === 'character'
    && (a.name ?? '') === (b.name ?? '') && a.voice === b.voice
}

// Builds the ONE request that reads a whole text aloud. Gemini allows two
// speakers per request: the narrator, plus the first character who speaks.
// Any further characters are read by the narrator, acting out their voice.
export function buildTtsRequest(segments: StorySegment[], language: Language): TtsRequest {
  const firstCharacter = segments.find(s => s.speaker === 'character')
  const characterSpeaker = firstCharacter ? speakerId(firstCharacter.name) : null
  const multi = !!firstCharacter

  const parts: SpeechPart[] = []
  for (const segment of segments) {
    let speaker = NARRATOR_SPEAKER
    let style = narratorStyle(language)
    if (segment.speaker === 'character') {
      const voice = segment.voice ?? 'friendly'
      if (firstCharacter && sameCharacter(segment, firstCharacter)) {
        speaker = characterSpeaker!
        style = characterStyle(voice, segment.name, language)
      } else {
        style = narratorActingStyle(voice, segment.name, language)
      }
    }
    const text = segment.text.trim()
    if (!text) continue

    // Neighbouring parts in the same voice and style read as one
    const previous = parts[parts.length - 1]
    if (previous && previous.speech_metadata.style === style && previous.speech_metadata.speaker === (multi ? speaker : undefined)) {
      previous.text = `${previous.text} ${text}`
      continue
    }
    parts.push({ text, speech_metadata: multi ? { speaker, style } : { style } })
  }

  const voiceOf = (voiceName: string): VoiceConfig => ({ prebuiltVoiceConfig: { voiceName } })
  const speechConfig: TtsRequest['generationConfig']['speechConfig'] = multi
    ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: NARRATOR_SPEAKER, voiceConfig: voiceOf(NARRATOR_VOICE) },
            { speaker: characterSpeaker!, voiceConfig: voiceOf(characterVoiceName(firstCharacter!.voice ?? 'friendly')) },
          ],
        },
      }
    : { voiceConfig: voiceOf(NARRATOR_VOICE) }

  return {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig },
  }
}

// --- Streaming ---------------------------------------------------------------

export interface AudioChunk {
  data: Uint8Array
  mimeType: string
}

export class TtsError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'TtsError'
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const buf = Buffer.from(b64, 'base64')
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

// The streaming endpoint sends headerless PCM. The non-streaming one sends a
// WAV file; if a WAV ever turns up here, drop its header so the bytes stay PCM.
function stripWavHeader(bytes: Uint8Array): Uint8Array {
  const isRiff = bytes.length > 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF'
  if (!isRiff) return bytes
  for (let i = 12; i + 8 <= bytes.length; i++) {
    if (bytes[i] === 0x64 && bytes[i + 1] === 0x61 && bytes[i + 2] === 0x74 && bytes[i + 3] === 0x61) {
      return bytes.subarray(i + 8)
    }
  }
  return bytes
}

export interface SseEvent {
  chunks: AudioChunk[]
  // Set on the last event: STOP when the audio is complete
  finishReason?: string
}

// One server-sent event from :streamGenerateContent?alt=sse, already split on
// its blank line, to the audio it carries (usually exactly one chunk).
export function parseSseEvent(event: string): SseEvent {
  const data = event
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart())
    .join('\n')
  if (!data) return { chunks: [] }
  const json = JSON.parse(data) as {
    error?: { code?: number; message?: string }
    candidates?: Array<{
      finishReason?: string
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> }
    }>
  }
  if (json.error) throw new TtsError(json.error.code ?? 500, json.error.message ?? 'TTS stream error')
  const candidate = json.candidates?.[0]
  const chunks: AudioChunk[] = []
  for (const part of candidate?.content?.parts ?? []) {
    const inline = part.inlineData
    if (!inline?.data) continue
    const mimeType = inline.mimeType ?? 'audio/l16; rate=24000; channels=1'
    const bytes = base64ToBytes(inline.data)
    chunks.push({ data: mimeType.includes('wav') ? stripWavHeader(bytes) : bytes, mimeType })
  }
  return { chunks, ...(candidate?.finishReason ? { finishReason: candidate.finishReason } : {}) }
}

// The SSE body to audio chunks as they arrive. Events end with \r\n\r\n, so
// carriage returns are dropped before splitting on blank lines.
//
// A stream that ends without finishReason STOP was cut off (a token limit, a
// safety stop, a dropped connection). That ends in an error rather than a
// quiet end, so a clipped story is never stored and replayed as if whole.
export async function* sseAudioChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<AudioChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finishReason: string | undefined
  const read = (event: string): AudioChunk[] => {
    const parsed = parseSseEvent(event)
    finishReason = parsed.finishReason ?? finishReason
    return parsed.chunks
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
      let end: number
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        yield* read(event)
      }
    }
    buffer += decoder.decode().replace(/\r/g, '')
    if (buffer.trim()) yield* read(buffer)
    if (finishReason !== 'STOP') {
      throw new TtsError(502, `TTS stream ended early (${finishReason ?? 'no finish reason'})`)
    }
  } finally {
    // Stops the upstream download when the consumer gives up early
    reader.cancel().catch(() => {})
  }
}

export function sampleRateOf(mimeType: string | null | undefined): number {
  const match = /rate=(\d+)/i.exec(mimeType ?? '')
  return match ? Number(match[1]) : 24000
}

// Fail fast, like the text calls in ./gemini: a narrator who never starts must
// hand control back so the family can read for themselves.
export const FIRST_AUDIO_TIMEOUT_MS = 8_000
// Silence mid-stream for this long means the stream has died
export const STALL_TIMEOUT_MS = 10_000

export interface NarrationStream {
  model: string
  sampleRate: number
  stream: ReadableStream<Uint8Array>
}

interface StreamOptions {
  apiKey: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
  firstAudioTimeoutMs?: number
  stallTimeoutMs?: number
}

function endpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
}

// Worth asking the cheaper model: it is rate-limited, overloaded or broken.
// A 400 or 403 would fail the same way twice, so those are not.
function shouldFallBack(error: unknown): boolean {
  if (error instanceof TtsError) return error.status === 429 || error.status >= 500
  return true // network failure, timeout, or a stream that ended with no audio
}

// Opens the narration stream: the main model first and, on a 429, a 5xx, a
// timeout or no audio at all, the cheaper sibling once. The fallback can only
// happen before the first byte goes to the browser, so this waits for the
// first audio chunk before it returns.
export async function streamNarration(request: TtsRequest, options: StreamOptions): Promise<NarrationStream> {
  const fetchImpl = options.fetchImpl ?? fetch
  const firstAudioTimeoutMs = options.firstAudioTimeoutMs ?? FIRST_AUDIO_TIMEOUT_MS
  const stallTimeoutMs = options.stallTimeoutMs ?? STALL_TIMEOUT_MS
  const body = JSON.stringify(request)
  const models = [TTS_MODEL, TTS_FALLBACK_MODEL]
  let lastError: unknown

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt]
    if (options.signal?.aborted) throw new TtsError(499, 'Narration cancelled')

    const upstream = new AbortController()
    const abortUpstream = () => upstream.abort()
    options.signal?.addEventListener('abort', abortUpstream, { once: true })
    const firstTimer = setTimeout(abortUpstream, firstAudioTimeoutMs)

    try {
      const response = await fetchImpl(endpoint(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': options.apiKey },
        body,
        signal: upstream.signal,
      })
      if (!response.ok || !response.body) {
        const detail = (await response.text().catch(() => '')).slice(0, 300)
        throw new TtsError(response.status, `${model} answered ${response.status}: ${detail}`)
      }

      const chunks = sseAudioChunks(response.body)
      const first = await chunks.next()
      if (first.done) throw new Error(`${model} returned no audio`)
      clearTimeout(firstTimer)

      let stallTimer: ReturnType<typeof setTimeout> | undefined
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(first.value.data)
        },
        async pull(controller) {
          stallTimer = setTimeout(abortUpstream, stallTimeoutMs)
          try {
            const next = await chunks.next()
            if (next.done) {
              controller.close()
              options.signal?.removeEventListener('abort', abortUpstream)
            } else {
              controller.enqueue(next.value.data)
            }
          } catch (error) {
            controller.error(error)
          } finally {
            clearTimeout(stallTimer)
          }
        },
        cancel() {
          clearTimeout(stallTimer)
          abortUpstream()
          void chunks.return(undefined)
        },
      })
      return { model, sampleRate: sampleRateOf(first.value.mimeType), stream }
    } catch (error) {
      clearTimeout(firstTimer)
      options.signal?.removeEventListener('abort', abortUpstream)
      upstream.abort()
      lastError = error
      if (options.signal?.aborted) throw new TtsError(499, 'Narration cancelled')
      if (!shouldFallBack(error)) break
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Narration failed')
}
