export type Language = 'da' | 'en'

export function languageInstruction(language: Language, format: 'json' | 'text' = 'json'): string {
  const formatNote = format === 'json'
    ? 'Keep JSON field names in English — only the values are in the target language.'
    : 'Respond with plain prose only — never JSON, markdown, or field names.'
  if (language === 'da') {
    return `LANGUAGE: Write ALL player-facing text in natural, simple, vivid Danish (Denmark) that children aged 8-10 understand. Short sentences. Everyday words. ${formatNote}`
  }
  return `LANGUAGE: Write all player-facing text in simple, vivid language that children aged 8-10 understand. ${formatNote}`
}
