import { generateJSON } from './gemini'
import type { GeneratedAction, StoryContext } from '@/types/ai'

export async function generateActions(
  context: StoryContext,
  currentScene: string
): Promise<GeneratedAction[]> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)

  const prompt = `You are a D&D dungeon master creating action options.

Current Scene: ${currentScene}

Current Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}

Generate exactly 3 action options the player could take. Each should:
- Use a different stat when possible (strength, magic, agility, heart)
- Include at least one non-combat option
- Be clear enough for a child to understand
- Have a "sceneFit" rating based on how smart the choice is for THIS situation (independent of character stats)

Return JSON array:
[
  {
    "id": "1",
    "text": "Action description in first person (I will...)",
    "stat": "strength|magic|agility|heart",
    "sceneFit": "good|okay|risky",
    "sceneFitReason": "Why this is or isn't a smart choice for this scene"
  }
]

One option should be "good" (smart for this scene), one "okay", one "risky".`

  return generateJSON<GeneratedAction[]>(prompt)
}
