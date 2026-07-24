import { SchemaType, type ResponseSchema } from '@google/generative-ai'
import { generateJSON } from './gemini'
import { languageInstruction } from './language'
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

export async function generateEpilogue(context: EpilogueContext): Promise<GeneratedEpilogue> {
  const prompt = `You are a D&D dungeon master closing a family adventure with a storybook epilogue. The heroes have just defeated ${context.villain ?? 'the villain'} and completed their quest!

${languageInstruction(context.language)}

The quest: "${context.questTitle}" — ${context.questGoal}

The heroes:
${context.heroes.map(describeHeroForEpilogue).join('\n')}

What happened (last chapters):
${context.storyHistory.slice(-8).join('\n')}

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
- Award titles and reasons are in the story language`

  return generateJSON<GeneratedEpilogue>(prompt, EPILOGUE_SCHEMA)
}
