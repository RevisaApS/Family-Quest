import { GoogleGenAI, ThinkingLevel, type GenerateContentConfig, type Schema } from '@google/genai'

// Built on first use rather than at import: the client warns on every import
// when the key is absent, which is every test run and every keyless build.
let client: GoogleGenAI | null = null
export function genai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  return client
}

// gemini-3.5-flash is deprecated and its requests are routed here anyway.
const MODEL = 'gemini-3.6-flash'

// Three of these calls run back to back on every turn (scene → actions →
// outcome) before a kid sees what happened, so this latency IS the game's
// pacing. The model was spending ~1000 thinking tokens to write ~200 tokens of
// story, which tripled the wait without making the story any better.
// 3.6 ignores the old thinkingBudget and has no "off", so ask for the least.
const THINKING_OFF = { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }

// A call that never settles used to strand the table on a spinner with no
// button to press. Failing fast hands control back to the UI, which already
// knows how to retry a scene and how to carry on without an outcome.
const TIMEOUT_MS = 20_000

async function generate(prompt: string, config: GenerateContentConfig = {}): Promise<string> {
  const response = await genai().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { ...THINKING_OFF, httpOptions: { timeout: TIMEOUT_MS }, ...config },
  })
  // The old SDK threw on a blocked or empty answer; the UI's retry and
  // carry-on paths are built around that throw, so keep it.
  if (!response.text) throw new Error('AI response contained no text')
  return response.text
}

export async function generateText(prompt: string): Promise<string> {
  return generate(prompt)
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
  temperature?: number
): Promise<T> {
  const config: GenerateContentConfig = {
    responseMimeType: 'application/json',
    ...(responseSchema ? { responseSchema } : {}),
    ...(temperature === undefined ? {} : { temperature }),
  }

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return parseJsonLoosely<T>(await generate(prompt, config))
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
