import { generateText } from './gemini'
import { languageInstruction } from './language'
import type { StoryContext } from '@/types/ai'
import type { OutcomeType, Stat } from '@/types/game'

interface OutcomeContext {
  storyContext: StoryContext
  actionChosen: string
  stat: Stat
  outcome: OutcomeType
  currentScene: string
}

const OUTCOME_INSTRUCTIONS = {
  success: "The action succeeds. Describe how it works well and advances the story positively.",
  partial: "The action partially succeeds. It works but there's a complication or unexpected cost.",
  failure: "The action doesn't work as intended. But something interesting is revealed or a new opportunity appears. This is a plot twist, not a punishment.",
}

export async function generateOutcome(context: OutcomeContext): Promise<string> {
  const currentCharacter = context.storyContext.characters.find(
    c => c.playerId === context.storyContext.currentPlayerId
  )

  const prompt = `You are a D&D dungeon master narrating an outcome.

${languageInstruction(context.storyContext.language)}

Adventure Style: ${context.storyContext.adventureStyle}
Current Scene: ${context.currentScene}
Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${OUTCOME_INSTRUCTIONS[context.outcome]}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.`

  return generateText(prompt)
}
