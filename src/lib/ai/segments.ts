import type { Language } from './language'

// A scene told in reading order: mostly the narrator, now and then a short
// line spoken by someone in the story. The narrator reads the narrator parts
// and the speaking characters get voices of their own (see ./tts). The plain
// `narration` string everything else uses is built from these, so the page,
// the story memory and the image prompt never have to know segments exist.

// A small fixed set of voice types the story model picks from. ./tts maps each
// one to a prebuilt voice and a style, so the model never names real voices.
export const CHARACTER_VOICES = ['gruff', 'squeaky', 'wise', 'young', 'menacing', 'friendly'] as const
export type CharacterVoice = (typeof CHARACTER_VOICES)[number]

// Used when a character line arrives without a voice the code knows
const DEFAULT_VOICE: CharacterVoice = 'friendly'

// A speaker's name only steers the voice; anything longer is not a name
export const MAX_NAME_CHARS = 40

export interface StorySegment {
  speaker: 'narrator' | 'character'
  // Who is speaking; only on character lines
  name?: string
  voice?: CharacterVoice
  text: string
}

// Quote marks the model may wrap a spoken line in, despite being told not to.
// They are stripped so the joined narration never shows doubled quotes.
const QUOTE_CHARS = `"'»«„“”‘’`
const EDGE_QUOTES = new RegExp(`^[${QUOTE_CHARS}\\s]+|[${QUOTE_CHARS}\\s]+$`, 'g')

function isVoice(value: unknown): value is CharacterVoice {
  return typeof value === 'string' && (CHARACTER_VOICES as readonly string[]).includes(value)
}

// Keeps every well-formed segment and repairs the small things a model gets
// wrong (an unknown voice, quotes around a line, a stray empty entry, an
// overlong name). Returns nothing when nothing usable is left.
export function normalizeSegments(raw: unknown): StorySegment[] {
  const segments: StorySegment[] = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const { speaker, name, voice, text } = item as Record<string, unknown>
      if (typeof text !== 'string') continue
      if (speaker === 'character') {
        const spoken = text.replace(EDGE_QUOTES, '').trim()
        if (!spoken) continue
        const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_CHARS).trim() : ''
        segments.push({
          speaker: 'character',
          ...(cleanName ? { name: cleanName } : {}),
          voice: isVoice(voice) ? voice : DEFAULT_VOICE,
          text: spoken,
        })
      } else {
        const told = text.trim()
        if (told) segments.push({ speaker: 'narrator', text: told })
      }
    }
  }
  return segments
}

// One narrator segment for text that has no dialogue: outcomes, the epilogue
// and the cliffhanger.
export function narratorOnly(text: string): StorySegment[] {
  const told = text.trim()
  return told ? [{ speaker: 'narrator', text: told }] : []
}

// The answer options, read after the scene so the kids who cannot read yet
// hear their choices too. One narrator segment, so all three cost one request.
const OPTION_WORDS: Record<Language, { ask: string; numbers: string[] }> = {
  da: { ask: 'Hvad gør I?', numbers: ['Én', 'To', 'Tre', 'Fire', 'Fem'] },
  en: { ask: 'What do you do?', numbers: ['One', 'Two', 'Three', 'Four', 'Five'] },
}

export function optionsSegments(options: string[], language: Language): StorySegment[] {
  const { ask, numbers } = OPTION_WORDS[language] ?? OPTION_WORDS.da
  const texts = options.map(o => o.trim()).filter(Boolean).slice(0, numbers.length)
  if (texts.length === 0) return []
  const sentence = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}.`)
  return narratorOnly([ask, ...texts.map((text, i) => `${numbers[i]}: ${sentence(text)}`)].join(' '))
}

// Danish books mark speech with »guillemets«; English uses curly quotes.
const QUOTES: Record<Language, [string, string]> = {
  da: ['»', '«'],
  en: ['“', '”'],
}

// The scene as one readable paragraph, spoken lines in quote marks.
export function joinSegments(segments: StorySegment[], language: Language): string {
  const [open, close] = QUOTES[language] ?? QUOTES.da
  return segments
    .map(s => (s.speaker === 'character' ? `${open}${s.text}${close}` : s.text))
    .join(' ')
    .trim()
}
