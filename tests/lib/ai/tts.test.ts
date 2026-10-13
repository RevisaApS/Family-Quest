import { describe, it, expect, vi } from 'vitest'
import {
  buildTtsRequest, characterVoiceName, parseSseEvent, sampleRateOf, speakerId, sseAudioChunks,
  streamNarration, TtsError, CHARACTER_VOICE_NAMES, NARRATOR_SPEAKER, NARRATOR_VOICE,
  TTS_FALLBACK_MODEL, TTS_MODEL,
} from '@/lib/ai/tts'
import { CHARACTER_VOICES, narratorOnly, type StorySegment } from '@/lib/ai/segments'

const DANISH = 'Danish, spoken with a native Danish accent and standard Danish pronunciation; '
const ENGLISH = 'Clear, natural English; '

const TROLL_SCENE: StorySegment[] = [
  { speaker: 'narrator', text: 'En trold spærrer broen.' },
  { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' },
  { speaker: 'narrator', text: 'Bag den fniser en nisse.' },
  { speaker: 'character', name: 'Nissen', voice: 'squeaky', text: 'Hihi, I er fanget!' },
]

type MultiConfig = { multiSpeakerVoiceConfig: { speakerVoiceConfigs: Array<{ speaker: string; voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } }> } }

describe('buildTtsRequest', () => {
  it('asks for audio only, in exactly one request for the whole text', () => {
    const request = buildTtsRequest(TROLL_SCENE, 'da')
    expect(request.generationConfig.responseModalities).toEqual(['AUDIO'])
    expect(request.contents).toHaveLength(1)
    expect(request.contents[0].role).toBe('user')
  })

  it('uses a single narrator voice when nobody speaks', () => {
    const request = buildTtsRequest(narratorOnly('Natten falder på.'), 'da')
    expect(request.generationConfig.speechConfig).toEqual({
      voiceConfig: { prebuiltVoiceConfig: { voiceName: NARRATOR_VOICE } },
    })
    const [part] = request.contents[0].parts
    expect(part.text).toBe('Natten falder på.')
    expect(part.speech_metadata.speaker).toBeUndefined()
  })

  it('gives the narrator and the first speaking character the two speaker slots', () => {
    const config = buildTtsRequest(TROLL_SCENE, 'da').generationConfig.speechConfig as MultiConfig
    expect(config.multiSpeakerVoiceConfig.speakerVoiceConfigs).toEqual([
      { speaker: NARRATOR_SPEAKER, voiceConfig: { prebuiltVoiceConfig: { voiceName: NARRATOR_VOICE } } },
      { speaker: 'Trolden', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
    ])
  })

  it('has the narrator act out any further characters, in their style', () => {
    const parts = buildTtsRequest(TROLL_SCENE, 'da').contents[0].parts
    expect(parts.map(p => p.speech_metadata.speaker)).toEqual([NARRATOR_SPEAKER, 'Trolden', NARRATOR_SPEAKER, NARRATOR_SPEAKER])
    expect(parts[3].text).toBe('Hihi, I er fanget!')
    expect(parts[3].speech_metadata.style).toContain('acting out the voice of Nissen')
    expect(parts[3].speech_metadata.style).toContain('squeaky')
  })

  it('opens every style with the language direction', () => {
    for (const part of buildTtsRequest(TROLL_SCENE, 'da').contents[0].parts) {
      expect(part.speech_metadata.style.startsWith(DANISH)).toBe(true)
    }
    for (const part of buildTtsRequest(TROLL_SCENE, 'en').contents[0].parts) {
      expect(part.speech_metadata.style.startsWith(ENGLISH)).toBe(true)
    }
  })

  it('directs the narrator as an exciting storyteller for two eight-year-olds', () => {
    const [part] = buildTtsRequest(narratorOnly('Natten falder på.'), 'da').contents[0].parts
    expect(part.speech_metadata.style).toBe(
      DANISH + 'a captivating fairy-tale storyteller reading aloud to two eight-year-old boys: lively and suspenseful, with dramatic pauses, warm but exciting'
    )
  })

  it('never puts a direction into the spoken text', () => {
    for (const part of buildTtsRequest(TROLL_SCENE, 'da').contents[0].parts) {
      expect(part.text).not.toMatch(/Danish|storyteller|voice of/i)
    }
  })

  it('merges neighbouring narrator segments into one part', () => {
    const parts = buildTtsRequest([
      { speaker: 'narrator', text: 'Det regner.' },
      { speaker: 'narrator', text: 'Vinden hyler.' },
    ], 'da').contents[0].parts
    expect(parts).toHaveLength(1)
    expect(parts[0].text).toBe('Det regner. Vinden hyler.')
  })

  it('keeps one character on their own voice across several lines', () => {
    const parts = buildTtsRequest([
      { speaker: 'character', name: 'Heksen', voice: 'menacing', text: 'Så I kom alligevel.' },
      { speaker: 'narrator', text: 'Hun smiler.' },
      { speaker: 'character', name: 'Heksen', voice: 'menacing', text: 'Godt.' },
    ], 'da').contents[0].parts
    expect(parts.map(p => p.speech_metadata.speaker)).toEqual(['Heksen', NARRATOR_SPEAKER, 'Heksen'])
  })
})

describe('voices and speaker ids', () => {
  it('maps every character voice type to a prebuilt voice', () => {
    for (const voice of CHARACTER_VOICES) expect(characterVoiceName(voice)).toBeTruthy()
    expect(CHARACTER_VOICE_NAMES.gruff).toBe('Algenib')
    expect(CHARACTER_VOICE_NAMES.squeaky).toBe('Puck')
  })

  it('never lets a character share the narrator\'s voice', () => {
    for (const voice of CHARACTER_VOICES) expect(characterVoiceName(voice)).not.toBe(NARRATOR_VOICE)
  })

  it('turns Danish names into plain ASCII speaker ids', () => {
    expect(speakerId('Fru Ærø')).toBe('FruAeroe')
    expect(speakerId('Skovtrolden Grum')).toBe('SkovtroldenGrum')
    expect(speakerId('Frø-kongen Åge')).toBe('FroekongenAage')
  })

  it('falls back to a generic id that cannot clash with the narrator', () => {
    expect(speakerId(undefined)).toBe('Figur')
    expect(speakerId('???')).toBe('Figur')
    expect(speakerId('Fortæller')).toBe('Figur')
  })
})

// A real event shape from :streamGenerateContent?alt=sse
function sseEvent(pcm: number[], mimeType = 'audio/l16; rate=24000; channels=1'): string {
  const data = Buffer.from(pcm).toString('base64')
  return `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }] } }] })}\r\n\r\n`
}

// The closing event of a complete stream
const STOP = 'data: {"candidates":[{"finishReason":"STOP"}]}\r\n\r\n'

function streamOf(...pieces: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece))
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<number[]> {
  const bytes: number[] = []
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) return bytes
    bytes.push(...value)
  }
}

describe('SSE parsing', () => {
  it('decodes the base64 PCM in an event', () => {
    const { chunks: [chunk], finishReason } = parseSseEvent(sseEvent([1, 2, 3, 4]).replace(/\r/g, '').trim())
    expect([...chunk.data]).toEqual([1, 2, 3, 4])
    expect(sampleRateOf(chunk.mimeType)).toBe(24000)
    expect(finishReason).toBeUndefined()
  })

  it('reads the finish reason off the closing event', () => {
    expect(parseSseEvent(STOP.trim()).finishReason).toBe('STOP')
  })

  it('throws on an error event', () => {
    expect(() => parseSseEvent('data: {"error":{"code":429,"message":"quota"}}')).toThrow(TtsError)
  })

  it('splits \\r\\n\\r\\n-separated events, even when a network chunk cuts one in half', async () => {
    const whole = sseEvent([1, 2]) + sseEvent([3, 4]) + sseEvent([5, 6]) + STOP
    const cut = Math.floor(whole.length / 2)
    const chunks = []
    for await (const chunk of sseAudioChunks(streamOf(whole.slice(0, cut), whole.slice(cut)))) chunks.push(...chunk.data)
    expect(chunks).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('ends in an error when the stream is cut off, so a clipped story is never kept', async () => {
    const drain = async (body: ReadableStream<Uint8Array>) => { for await (const chunk of sseAudioChunks(body)) void chunk }
    await expect(drain(streamOf(sseEvent([1, 2]), 'data: {"candidates":[{"finishReason":"MAX_TOKENS"}]}\r\n\r\n')))
      .rejects.toThrow('MAX_TOKENS')
    await expect(drain(streamOf(sseEvent([1, 2])))).rejects.toThrow('no finish reason')
    await expect(drain(streamOf(sseEvent([1, 2]), STOP))).resolves.toBeUndefined()
  })

  it('strips a WAV header if one ever arrives', () => {
    const header = [...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WAVEfmt '), 16, 0, 0, 0, ...new Array(16).fill(0), ...Buffer.from('data'), 4, 0, 0, 0]
    const { chunks: [chunk] } = parseSseEvent(sseEvent([...header, 9, 8, 7, 6], 'audio/wav').trim())
    expect([...chunk.data]).toEqual([9, 8, 7, 6])
  })
})

function sseResponse(...events: string[]): Response {
  return new Response(streamOf(...events), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

const REQUEST = buildTtsRequest(narratorOnly('Natten falder på.'), 'da')

describe('streamNarration', () => {
  it('streams the main model\'s audio with one request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(sseResponse(sseEvent([1, 2]), sseEvent([3, 4]), STOP))
    const result = await streamNarration(REQUEST, { apiKey: 'test-key', fetchImpl })
    expect(result.model).toBe(TTS_MODEL)
    expect(result.sampleRate).toBe(24000)
    expect(await collect(result.stream)).toEqual([1, 2, 3, 4])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toContain(`/models/${TTS_MODEL}:streamGenerateContent?alt=sse`)
    expect(init.headers['x-goog-api-key']).toBe('test-key')
    expect(JSON.parse(init.body)).toEqual(REQUEST)
  })

  it('falls back to flash-lite once on a 429', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('quota', { status: 429 }))
      .mockResolvedValueOnce(sseResponse(sseEvent([7, 8]), STOP))
    const result = await streamNarration(REQUEST, { apiKey: 'k', fetchImpl })
    expect(result.model).toBe(TTS_FALLBACK_MODEL)
    expect(fetchImpl.mock.calls[1][0]).toContain(`/models/${TTS_FALLBACK_MODEL}:`)
    expect(await collect(result.stream)).toEqual([7, 8])
  })

  it('falls back on a 5xx', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(sseResponse(sseEvent([7, 8]), STOP))
    expect((await streamNarration(REQUEST, { apiKey: 'k', fetchImpl })).model).toBe(TTS_FALLBACK_MODEL)
  })

  it('falls back when the main model sends no audio at all', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(sseResponse('data: {"candidates":[{"finishReason":"OTHER"}]}\r\n\r\n'))
      .mockResolvedValueOnce(sseResponse(sseEvent([7, 8]), STOP))
    expect((await streamNarration(REQUEST, { apiKey: 'k', fetchImpl })).model).toBe(TTS_FALLBACK_MODEL)
  })

  it('falls back when the main model never starts', async () => {
    const hang = (_url: string, init: RequestInit) => new Promise<Response>((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
    const fetchImpl = vi.fn()
      .mockImplementationOnce(hang)
      .mockResolvedValueOnce(sseResponse(sseEvent([7, 8]), STOP))
    const result = await streamNarration(REQUEST, { apiKey: 'k', fetchImpl, firstAudioTimeoutMs: 20 })
    expect(result.model).toBe(TTS_FALLBACK_MODEL)
  })

  it('errors the stream when the audio is cut off after it has started', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      sseResponse(sseEvent([1, 2]), sseEvent([3, 4]), 'data: {"candidates":[{"finishReason":"OTHER"}]}\r\n\r\n')
    )
    const result = await streamNarration(REQUEST, { apiKey: 'k', fetchImpl })
    // Too late to fall back: the browser has bytes, so the stream itself fails
    await expect(collect(result.stream)).rejects.toThrow('OTHER')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('gives up after two requests when both models are busy, never retrying further', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => new Response('quota', { status: 429 }))
    await expect(streamNarration(REQUEST, { apiKey: 'k', fetchImpl })).rejects.toMatchObject({ status: 429 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does not fall back on a bad request, which would fail the same way twice', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('bad', { status: 400 }))
    await expect(streamNarration(REQUEST, { apiKey: 'k', fetchImpl })).rejects.toMatchObject({ status: 400 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
