export type Language = 'da' | 'en'

export function languageInstruction(language: Language): string {
  if (language === 'da') {
    return `LANGUAGE: Write ALL player-facing text in natural, simple, vivid Danish (Denmark) that children aged 8-10 understand. Short sentences. Everyday words. Keep JSON field names in English — only the values are in Danish.`
  }
  return `LANGUAGE: Write all player-facing text in simple, vivid language that children aged 8-10 understand.`
}
