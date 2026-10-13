// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildTtsRequest, streamNarration } from '@/lib/ai/tts'
import type { StorySegment } from '@/lib/ai/segments'

// Preflight for the narrator against the REAL Gemini TTS API. Opt-in only:
// Google caps the TTS models at about 100 requests a day, so this never runs
// with the ordinary live tests. Load the key the same way as live-ai.test.ts,
// then run it with LIVE_TTS=1:
//
//   LIVE_TTS=1 npx vitest run tests/integration/live-tts.test.ts
const enabled = !!process.env.GOOGLE_AI_API_KEY && process.env.LIVE_TTS === '1'

const SCENE: StorySegment[] = [
  { speaker: 'narrator', text: 'Tågen ligger tæt over den gamle stenbro, og under den rumler noget stort.' },
  { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Hvem tramper på min bro?' },
  { speaker: 'narrator', text: 'Hvad gør I?' },
]

describe.skipIf(!enabled)('live Gemini TTS', () => {
  it('streams a Danish narrator and a character voice, first audio within 5 s', async () => {
    const started = Date.now()
    const { model, sampleRate, stream } = await streamNarration(buildTtsRequest(SCENE, 'da'), {
      apiKey: process.env.GOOGLE_AI_API_KEY!,
    })
    const reader = stream.getReader()
    let firstAudioMs = -1
    let bytes = 0
    let chunks = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (firstAudioMs < 0) firstAudioMs = Date.now() - started
      bytes += value.byteLength
      chunks++
    }
    const totalMs = Date.now() - started
    const audioSeconds = bytes / 2 / sampleRate
    console.log(`\n--- ${model}: first audio ${firstAudioMs} ms, ${chunks} chunks, ${audioSeconds.toFixed(1)} s of audio generated in ${totalMs} ms ---\n`)

    expect(sampleRate).toBe(24000)
    expect(firstAudioMs).toBeGreaterThanOrEqual(0)
    expect(firstAudioMs).toBeLessThan(5000)
    // About 20 words read aloud: several seconds of 16-bit audio, whole samples
    expect(audioSeconds).toBeGreaterThan(3)
    expect(bytes % 2).toBe(0)
  }, 60_000)
})
