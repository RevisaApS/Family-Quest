import { SchemaType, type ResponseSchema, type Schema } from '@google/generative-ai'
import { generateJSON } from './gemini'
import { languageInstruction } from './language'
import type { GeneratedAction, StoryContext } from '@/types/ai'
import type { SceneFit, Stat } from '@/types/game'

// Pinning stat and sceneFit to enums keeps the UI honest: an off-list value
// used to sail through and render a blank icon instead of failing loudly.
const STAT_SCHEMA: Schema = {
  type: SchemaType.STRING,
  format: 'enum',
  enum: ['strength', 'magic', 'agility', 'heart'],
}
const SCENE_FIT_SCHEMA: Schema = {
  type: SchemaType.STRING,
  format: 'enum',
  enum: ['good', 'okay', 'risky'],
}

const ACTIONS_SCHEMA: ResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      text: { type: SchemaType.STRING },
      stat: STAT_SCHEMA,
      sceneFit: SCENE_FIT_SCHEMA,
      sceneFitReason: { type: SchemaType.STRING },
    },
    required: ['id', 'text', 'stat', 'sceneFit', 'sceneFitReason'],
  },
}

const CUSTOM_ACTION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    stat: STAT_SCHEMA,
    sceneFit: SCENE_FIT_SCHEMA,
    sceneFitReason: { type: SchemaType.STRING },
  },
  required: ['stat', 'sceneFit', 'sceneFitReason'],
}

export async function generateActions(
  context: StoryContext,
  currentScene: string
): Promise<GeneratedAction[]> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)
  const inBattle = context.encounterPhase === 'active' && !!context.encounter

  const prompt = `You are a D&D dungeon master creating action options.

${languageInstruction(context.language)}

Current Scene: ${currentScene}

Current Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
${currentCharacter?.rpg?.skillNames.length ? `Their powers: ${currentCharacter.rpg.skillNames.join(', ')}` : ''}
${currentCharacter?.rpg?.gearNames.length ? `Their equipment: ${currentCharacter.rpg.gearNames.join(', ')}` : ''}
${currentCharacter?.rpg?.petName ? `Their pet companion: ${currentCharacter.rpg.petName} — one action may playfully involve the pet when it fits.` : ''}
${inBattle ? `BATTLE: they are locked in combat with ${context.encounter!.name}! ALL 3 actions must be ways to ATTACK and inflict damage on the enemy — e.g. a mighty strike, a clever spell, a daring acrobatic maneuver, a fearless charge. NEVER offer friendly or passive options: no giving food or gifts, no befriending, no comforting, no talking it out, no running away.` : ''}
${inBattle && context.encounter?.enraged && context.encounter.weakStat ? `The enemy's glowing WEAK SPOT is vulnerable to ${context.encounter.weakStat} — at least one action must use that stat and aim for the weak spot.` : ''}
${currentCharacter?.rpg?.skillNames.length || currentCharacter?.rpg?.gearNames.length ? 'When it fits the scene, let one action use a named power or piece of equipment — kids love using their own gear.' : ''}

Generate exactly 3 action options the player could take. Each should:
- Use a different stat when possible (strength, magic, agility, heart)
${inBattle ? '- Be an attack that hurts or weakens the enemy' : '- Include at least one non-combat option'}
- Be clear enough for a child to understand
- Be SHORT: max 10 words, so a child can read it quickly
- Have a "sceneFit" rating based on how smart the choice is for THIS situation (independent of character stats)

Return JSON array:
[
  {
    "id": "1",
    "text": "Short action in first person (${context.language === 'da' ? 'Jeg vil...' : 'I will...'})",
    "stat": "strength|magic|agility|heart",
    "sceneFit": "good|okay|risky",
    "sceneFitReason": "Why this is or isn't a smart choice for this scene"
  }
]

One option should be "good" (smart for this scene), one "okay", one "risky".`

  return generateJSON<GeneratedAction[]>(prompt, ACTIONS_SCHEMA)
}

// "My own idea!" — the kid says their own plan and the DM grades it like any
// other action: which stat it uses and how smart it is for this scene. The
// idea is NEVER rejected; wild plans just come back as "risky".
export async function classifyCustomAction(
  context: StoryContext,
  currentScene: string,
  idea: string
): Promise<GeneratedAction> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)
  const inBattle = context.encounterPhase === 'active' && !!context.encounter

  const prompt = `You are a D&D dungeon master. A child playing ${currentCharacter?.characterName} the ${currentCharacter?.class} has proposed their OWN action idea.

${languageInstruction(context.language)}

Current Scene: ${currentScene}
${inBattle ? `They are locked in combat with ${context.encounter!.name}.` : ''}

The child's idea: "${idea}"

Grade the idea — never reject it, every idea is playable:
- "stat": which stat the attempt relies on most (strength, magic, agility, heart)
- "sceneFit": "good" if it's a clever fit for this scene, "okay" if reasonable, "risky" if wild or dangerous (wild ideas are welcome — they're just risky)
- "sceneFitReason": one kid-friendly sentence explaining the grade, in the story language

Return JSON:
{
  "stat": "strength|magic|agility|heart",
  "sceneFit": "good|okay|risky",
  "sceneFitReason": "..."
}`

  const graded = await generateJSON<{ stat: Stat; sceneFit: SceneFit; sceneFitReason: string }>(
    prompt,
    CUSTOM_ACTION_SCHEMA
  )
  const stats: Stat[] = ['strength', 'magic', 'agility', 'heart']
  const fits: SceneFit[] = ['good', 'okay', 'risky']
  return {
    id: 'custom',
    text: idea,
    stat: stats.includes(graded.stat) ? graded.stat : 'heart',
    sceneFit: fits.includes(graded.sceneFit) ? graded.sceneFit : 'okay',
    sceneFitReason: graded.sceneFitReason ?? '',
  }
}
