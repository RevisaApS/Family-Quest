// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const streamNarration = vi.fn()
vi.mock('@/lib/ai/tts', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/ai/tts')>()),
  streamNarration: (...args: unknown[]) => streamNarration(...args),
}))

const { POST } = await import('@/app/api/ai/narrate/route')
const { MAX_BODY_CHARS, MAX_SEGMENTS, MAX_SEGMENT_CHARS } = await import('@/lib/ai/tts')

function post(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  return POST(new Request('http://localhost/api/ai/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: raw,
  }))
}

const line = (text: string) => ({ speaker: 'narrator', text })

describe('POST /api/ai/narrate', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key')
    streamNarration.mockReset()
    streamNarration.mockResolvedValue({
      model: 'gemini-3.8-flash-tts',
      sampleRate: 24000,
      stream: new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1, 2])); c.close() } }),
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('streams PCM for a valid request', async () => {
    const response = await post({ segments: [line('Porten knirker.')], language: 'da' })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('audio/L16; rate=24000; channels=1')
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2])
  })

  it('turns away an oversized body before parsing it', async () => {
    const huge = JSON.stringify({ segments: [line('x'.repeat(MAX_BODY_CHARS))] })
    expect((await post(huge)).status).toBe(413)
    // A lying or missing content-length is caught by the length check too
    expect((await post({ segments: [line('Hej')] }, { 'content-length': String(MAX_BODY_CHARS + 1) })).status).toBe(413)
    expect(streamNarration).not.toHaveBeenCalled()
  })

  it('rejects too many segments, an overlong segment, or nothing to read', async () => {
    expect((await post({ segments: Array.from({ length: MAX_SEGMENTS + 1 }, () => line('Hej.')) })).status).toBe(400)
    expect((await post({ segments: [line('x'.repeat(MAX_SEGMENT_CHARS + 1))] })).status).toBe(400)
    expect((await post({ segments: [line('   ')] })).status).toBe(400)
    expect((await post({ segments: 'nope' })).status).toBe(400)
    expect((await post('not json')).status).toBe(400)
    expect(streamNarration).not.toHaveBeenCalled()
  })

  it('caps a character name before it reaches Google', async () => {
    await post({ segments: [{ speaker: 'character', name: 'N'.repeat(500), voice: 'gruff', text: 'Hm!' }] })
    const request = streamNarration.mock.calls[0][0]
    const speakers = request.generationConfig.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs
    expect(speakers[1].speaker.length).toBeLessThanOrEqual(40)
    expect(request.contents[0].parts[0].speech_metadata.style.length).toBeLessThan(300)
  })

  it('passes a 429 through, so the browser can rest the narrator', async () => {
    const { TtsError } = await import('@/lib/ai/tts')
    streamNarration.mockRejectedValue(new TtsError(429, 'quota'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await post({ segments: [line('Hej.')] })).status).toBe(429)
    streamNarration.mockRejectedValue(new TtsError(503, 'down'))
    expect((await post({ segments: [line('Hej.')] })).status).toBe(502)
  })
})
