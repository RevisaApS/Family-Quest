import { SchemaType, type ResponseSchema } from '@google/generative-ai'
import { generateJSON } from './gemini'
import { languageInstruction } from './language'
import { themeById, type ValueThemeId } from '@/lib/game/values'
import type { AdventureStyle, CharacterClass } from '@/types/game'
import type { Language } from './language'
import type { PlayerTurnStats } from '@/lib/game/chronicle'

// The storybook ending: after the boss falls, the DM writes "The Tale of..."
// — a short epilogue retelling the family's quest, plus one personal award
// per hero grounded in what actually happened at the table.

export interface EpilogueContext {
  language: Language
  adventureStyle: AdventureStyle
  questTitle: string
  questGoal: string
  villain?: string
  // The adventure's hidden values theme, so an award can find the moment a
  // hero paid for a choice. Never named in the epilogue text itself.
  valueTheme?: ValueThemeId
  storyHistory: string[]
  heroes: Array<{
    playerId: string
    characterName: string
    playerName: string
    class: CharacterClass
    level: number
    petName?: string
    stats: PlayerTurnStats
  }>
}

export interface GeneratedEpilogue {
  title: string
  story: string
  awards: Array<{ playerId: string; title: string; reason: string }>
}

const EPILOGUE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    story: { type: SchemaType.STRING },
    awards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          playerId: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ['playerId', 'title', 'reason'],
      },
    },
  },
  required: ['title', 'story', 'awards'],
}

function describeHeroForEpilogue(h: EpilogueContext['heroes'][number]): string {
  const stats = `${h.stats.turns} turns, ${h.stats.successes} successes, ${h.stats.crits} legendary rolls (natural 20), ${h.stats.fumbles} comical fumbles (natural 1)`
  return `- ${h.characterName} the ${h.class} (played by ${h.playerName}), reached level ${h.level}${h.petName ? `, with their pet ${h.petName}` : ''} — ${stats}`
}

// The one place a costly choice becomes visible: the award names the moment and
// stops. Kids hear glory; the grown-up reading it aloud hears the thing land.
// It must never explain why the moment mattered — that conversation belongs at
// the dinner table, not to the game.
function costlyMomentRule(theme: ValueThemeId | undefined): string {
  const values = themeById(theme)
  return `- If the story shows a hero giving up something they wanted — treasure, gold, a shortcut, an easy way out — staying with someone who needed them, putting right something that went wrong, or keeping calm while someone goaded them, then THAT hero's award names THAT EXACT MOMENT in plain story words, and stops there. Shape: "Lucas, who stayed with the wounded wolf even as the gate closed." One clause, the moment itself, nothing after it.
- NEVER state or hint at a lesson, a moral or a value in an award. No "learned that...", no "because helping others matters", no virtue word offered as the point. Describe what the hero did and stop.${values ? `
- FOR YOUR EYES ONLY, never quoted or paraphrased in the output — the kind of moment worth hunting for in the story above: ${values.dilemmaGuidance}` : ''}`
}

export async function generateEpilogue(context: EpilogueContext): Promise<GeneratedEpilogue> {
  const prompt = `You are a D&D dungeon master closing a family adventure with a storybook epilogue. The heroes have just defeated ${context.villain ?? 'the villain'} and completed their quest!

${languageInstruction(context.language)}

The quest: "${context.questTitle}" — ${context.questGoal}

The heroes:
${context.heroes.map(describeHeroForEpilogue).join('\n')}

What happened, oldest first:
${context.storyHistory.join('\n')}

Write the epilogue. Return JSON:
{
  "title": "a storybook title for this adventure, like 'The Tale of ...' (in the story language, 3-7 words)",
  "story": "4-6 sentences retelling the whole quest as a bedtime-story epilogue: how the heroes set out, the hardest moment, and how they triumphed together. Mention every hero by character name (and pets!). Past tense, warm, triumphant.",
  "awards": [
    { "playerId": "...", "title": "a 2-4 word award name", "reason": "one warm sentence explaining why this hero earned it" }
  ]
}

Award rules:
- EXACTLY one award per hero, using these playerIds: ${context.heroes.map(h => h.playerId).join(', ')}
- Every award is positive and personal — ground it in their stats or story moments (a natural 20 → something legendary; many fumbles → a lovable 'most entertaining tumbles'-style award, celebrated not mocked; few successes → bravest heart / never gave up)
${costlyMomentRule(context.valueTheme)}
- Award titles and reasons are in the story language`

  return generateJSON<GeneratedEpilogue>(prompt, EPILOGUE_SCHEMA)
}
