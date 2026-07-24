import { GoogleGenerativeAI, type GenerationConfig, type ResponseSchema } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const MODEL = 'gemini-3.5-flash'

// Three of these calls run back to back on every turn (scene → actions →
// outcome) before a kid sees what happened, so this latency IS the game's
// pacing. The model was spending ~1000 thinking tokens to write ~200 tokens of
// story, which tripled the wait without making the story any better.
const THINKING_OFF = { thinkingConfig: { thinkingBudget: 0 } }

// A call that never settles used to strand the table on a spinner with no
// button to press. Failing fast hands control back to the UI, which already
// knows how to retry a scene and how to carry on without an outcome.
const TIMEOUT_MS = 20_000

function buildModel(generationConfig: GenerationConfig) {
  return genAI.getGenerativeModel(
    {
      model: MODEL,
      // thinkingConfig is newer than these SDK types, same as the image config
      // in ./images.ts
      generationConfig: { ...THINKING_OFF, ...generationConfig } as GenerationConfig,
    },
    { timeout: TIMEOUT_MS }
  )
}

export async function generateText(prompt: string): Promise<string> {
  const result = await buildModel({}).generateContent(prompt)
  return result.response.text()
}

// Pass a responseSchema wherever possible: left to its own devices the model
// returns JSON that JSON.parse rejects roughly a quarter of the time (a
// doubled closing brace, or an object cut off mid-string), and mid-adventure
// that surfaced as an error in the kids' faces.
export async function generateJSON<T>(prompt: string, responseSchema?: ResponseSchema): Promise<T> {
  const model = buildModel({
    responseMimeType: 'application/json',
    ...(responseSchema ? { responseSchema } : {}),
  })

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return parseJsonLoosely<T>(result.response.text())
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
