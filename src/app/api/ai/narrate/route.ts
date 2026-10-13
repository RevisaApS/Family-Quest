import { normalizeSegments, type StorySegment } from '@/lib/ai/segments'
import {
  buildTtsRequest, streamNarration, TtsError,
  MAX_BODY_CHARS, MAX_SEGMENTS, MAX_SEGMENT_CHARS, MAX_TEXT_CHARS,
} from '@/lib/ai/tts'
import type { Language } from '@/lib/ai/language'

// A long epilogue is about 45 seconds of audio, generated in about 12.
export const maxDuration = 60

// POST { segments, language } -> the narration as raw PCM, streamed while it
// is generated: 16-bit little-endian mono, the sample rate in Content-Type.
// Exactly one Gemini request per call (two if the main model is busy).
//
// No per-visitor rate limit, like the other AI routes; the limits below cap
// what one request can cost.
export async function POST(request: Request) {
  // Oversized bodies are turned away before anything is parsed
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_CHARS) {
    return Response.json({ error: 'Too much to narrate' }, { status: 413 })
  }

  let segments: StorySegment[]
  let language: Language
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_CHARS) return Response.json({ error: 'Too much to narrate' }, { status: 413 })
    const body = JSON.parse(raw)
    if (!Array.isArray(body?.segments) || body.segments.length > MAX_SEGMENTS) {
      return Response.json({ error: 'Invalid segments' }, { status: 400 })
    }
    segments = normalizeSegments(body.segments)
    language = body?.language === 'en' ? 'en' : 'da'
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  if (
    segments.length === 0
    || totalChars > MAX_TEXT_CHARS
    || segments.some(s => s.text.length > MAX_SEGMENT_CHARS)
  ) {
    return Response.json({ error: 'Nothing to narrate, or too much' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return Response.json({ error: 'Narrator not configured' }, { status: 503 })

  try {
    const { model, sampleRate, stream } = await streamNarration(buildTtsRequest(segments, language), {
      apiKey,
      // The browser gave up (a timeout, a hidden page): end the upstream too
      signal: request.signal,
    })
    return new Response(stream, {
      headers: {
        'Content-Type': `audio/L16; rate=${sampleRate}; channels=1`,
        // no-transform keeps compression from holding chunks back
        'Cache-Control': 'no-store, no-transform',
        'X-Accel-Buffering': 'no',
        'X-Narrator-Model': model,
      },
    })
  } catch (error) {
    const status = error instanceof TtsError ? error.status : 502
    console.error('Narration error:', error instanceof Error ? error.message : error)
    // 429 stays 429 so the client can rest the narrator for a while; everything
    // else is a plain 502.
    return Response.json({ error: 'Narrator unavailable' }, { status: status === 429 ? 429 : 502 })
  }
}
