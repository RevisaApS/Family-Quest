import { GoogleGenAI, ThinkingLevel, type GenerateContentConfig, type Schema } from '@google/genai'

// Built on first use rather than at import: the client warns on every import
// when the key is absent, which is every test run and every keyless build.
let client: GoogleGenAI | null = null
export function genai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  return client
}


// Three of these calls run back to back on every turn (scene → actions →
// outcome) before a kid sees what happened, so this latency IS the game's
// pacing. The model was spending ~1000 thinking tokens to write ~200 tokens of
// story, which tripled the wait without making the story any better.
// 3.6 ignores the old thinkingBudget and has no "off", so ask for the least.
//
// Two writers. Story prose (scenes, outcomes, the epilogue, the cliffhanger)
// is read aloud to the kids and, in time, by them, so it goes to the model
// that spells Danish right: a blind proofread on 2026-10-12 found a mistake in
// 9 of 28 texts from 3.6-flash ("visker" for "hvisker", "et højt klang") and
// in 1 of 28 from 3.8-flash, at ~5.0 s per scene instead of ~2.7 s. More
// thinking on 3.6 barely helped (7 of 28). Short game text (action buttons,
// loot names, grading a kid's idea) had no mistakes and stays on the fast one.
// gemini-3.5-flash is deprecated and its requests are routed to 3.6 anyway;
// 3.8 has no minimal thinking, so it gets the lowest level it has.
export type Writer = 'story' | 'fast'
const WRITERS: Record<Writer, { model: string; thinkingLevel: ThinkingLevel }> = {
  story: { model: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
  fast: { model: 'gemini-3.6-flash', thinkingLevel: ThinkingLevel.MINIMAL },
}

// A call that never settles used to strand the table on a spinner with no
// button to press. Failing fast hands control back to the UI, which already
// knows how to retry a scene and how to carry on without an outcome.
const TIMEOUT_MS = 20_000

async function generate(prompt: string, config: GenerateContentConfig, writer: Writer): Promise<string> {
  const { model, thinkingLevel } = WRITERS[writer]
  const response = await genai().models.generateContent({
    model,
    contents: prompt,
    config: { thinkingConfig: { thinkingLevel }, httpOptions: { timeout: TIMEOUT_MS }, ...config },
  })
  // The old SDK threw on a blocked or empty answer; the UI's retry and
  // carry-on paths are built around that throw, so keep it.
  if (!response.text) throw new Error('AI response contained no text')
  return response.text
}

// A story call that fails (busy, timed out, empty) gets one more go on the
// fast writer: a slightly rougher sentence beats a stalled table.
export async function generateText(prompt: string, writer: Writer = 'fast'): Promise<string> {
  try {
    return await generate(prompt, {}, writer)
  } catch (error) {
    if (writer === 'fast') throw error
    return generate(prompt, {}, 'fast')
  }
}

// Pass a responseSchema wherever possible: left to its own devices the model
// returns JSON that JSON.parse rejects roughly a quarter of the time (a
// doubled closing brace, or an object cut off mid-string), and mid-adventure
// that surfaced as an error in the kids' faces.
export async function generateJSON<T>(
  prompt: string,
  responseSchema?: Schema,
  // Storytelling calls pass a higher temperature: with thinking off, the
  // default settles onto the same safe phrasing (and the same villain name)
  // every adventure. The response schema keeps the shape valid regardless.
  temperature?: number,
  writer: Writer = 'fast'
): Promise<T> {
  const config: GenerateContentConfig = {
    responseMimeType: 'application/json',
    ...(responseSchema ? { responseSchema } : {}),
    ...(temperature === undefined ? {} : { temperature }),
  }

  let lastError: unknown
  // The retry always goes to the fast writer, so a failed story call falls
  // back the same way generateText does.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return parseJsonLoosely<T>(await generate(prompt, config, attempt === 0 ? writer : 'fast'))
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

// Pulls the first balanced JSON value out of a response, tolerating markdown
// fences and trailing junk after the closing brace or bracket.
export function parseJsonLoosely<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    // fall through and try to repair it
  }

  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = text.search(/[[{]/)
  if (start === -1) throw new Error('AI response contained no JSON')

  const opener = text[start]
  const closer = opener === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]
    if (escaped) {
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else if (char === '"') {
      inString = !inString
    } else if (!inString) {
      if (char === opener) depth++
      else if (char === closer && --depth === 0) return JSON.parse(text.slice(start, i + 1)) as T
    }
  }
  throw new Error('AI response JSON was truncated')
}
