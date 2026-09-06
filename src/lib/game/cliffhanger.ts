// The last line of a session: when Far taps "Gem og afslut", the storyteller
// leaves one sentence hanging — the thing the twins will ask about next time.
// It is decorative and best-effort: the AI writes it when it can, and these
// helpers make sure there is always something to read when it can't.

import type { Language } from '@/lib/ai/language'

export const HOOK_MAX_CHARS = 160

const FALLBACK = {
  da: {
    withVillain: (villain: string) => `Men et sted i mørket venter ${villain} stadig...`,
    plain: 'Men eventyret er ikke slut endnu...',
  },
  en: {
    withVillain: (villain: string) => `But somewhere in the dark, ${villain} is still waiting...`,
    plain: 'But the adventure is not over yet...',
  },
}

export function fallbackHook(language: Language, villain?: string | null): string {
  const set = FALLBACK[language] ?? FALLBACK.en
  return villain?.trim() ? set.withVillain(villain.trim()) : set.plain
}

// One line, no quotes, no dice talk, always trailing off. Anything the model
// sends that can't be tidied into that comes back null so the caller can fall
// back rather than show a paragraph.
export function tidyHook(raw: string | null | undefined): string | null {
  if (!raw) return null
  let text = raw.replace(/\s+/g, ' ').trim()
  text = text.replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, '')
  // Keep the first sentence only, if the model wrote more
  const firstBreak = text.search(/(?<=[.!?…])\s+[A-ZÆØÅ]/)
  if (firstBreak > 0) text = text.slice(0, firstBreak).trim()
  if (text.length < 4) return null
  if (text.length > HOOK_MAX_CHARS) return null
  text = text.replace(/[.!?…]+$/, '')
  return `${text}...`
}
