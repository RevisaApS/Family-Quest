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
  damageTaken?: number
  bossDamage?: number
  crit?: 'crit' | 'fumble' | null
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

${languageInstruction(context.storyContext.language, 'text')}

Adventure Style: ${context.storyContext.adventureStyle}
Current Scene: ${context.currentScene}
Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${OUTCOME_INSTRUCTIONS[context.outcome]}
${context.storyContext.encounterPhase === 'active' && context.storyContext.encounter ? `This happens during the battle with ${context.storyContext.encounter.name}.` : ''}
${context.bossDamage ? `The hero's action lands a real blow on the enemy — describe the hit!` : ''}
${context.damageTaken ? `The hero also gets hurt in the process (a bump, a scrape, a tumble — never gory). Weave that in.` : ''}
${context.crit === 'crit' ? 'THE ROLL WAS A NATURAL 20 — describe a SPECTACULAR, legendary success that will be retold at the dinner table.' : ''}
${context.crit === 'fumble' ? 'THE ROLL WAS A NATURAL 1 — describe a COMICAL fumble (slipping, tangled cape, startled chicken). Funny, never humiliating.' : ''}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.`

  return generateText(prompt)
}
