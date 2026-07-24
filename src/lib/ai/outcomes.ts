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

// The chapter's choice just got answered. Both answers lead somewhere
// interesting — the shortcut is never a trap and the harder path is never safe,
// so there is no pattern for two bright kids to crack. Same spirit as
// "failure is a plot twist, not a punishment", extended to what they chose.
function dilemmaOutcomeRule(context: OutcomeContext): string {
  if (!context.storyContext.dilemma) return ''
  return `THIS TURN ANSWERED THE SCENE'S CHOICE. Read what the hero actually did:
- If they took the tempting shortcut (grabbed the prize, skipped the hard part, walked on, left someone behind, hit back): they DO get the thing they reached for — and in the same breath the world complicates. An interesting plot twist that makes the quest harder and more exciting, arriving as a consequence in the world, never as a punishment, a scolding or a hint that they chose wrong.
- If they took the harder path and gave that prize up: honour it — what they did lands and matters in the story, and someone or something is different because of it. Sometimes, not every time, it also complicates: the gate shuts, the shortcut is gone, someone else walks off with the treasure.
EITHER WAY: no lesson, no moral, no virtue words, nobody praising or judging the hero's character, no narrator comment on the choice. Only what happens next.`
}

export async function generateOutcome(context: OutcomeContext): Promise<string> {
  const currentCharacter = context.storyContext.characters.find(
    c => c.playerId === context.storyContext.currentPlayerId
  )

  const prompt = `You are a D&D dungeon master narrating an outcome.

${languageInstruction(context.storyContext.language, 'text')}

Adventure Style: ${context.storyContext.adventureStyle}

What happened just before (oldest first):
${context.storyContext.storyHistory.slice(-3).join('\n') || 'This is the first thing to happen.'}

Current Scene: ${context.currentScene}
Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${OUTCOME_INSTRUCTIONS[context.outcome]}
${dilemmaOutcomeRule(context)}
${context.storyContext.encounterPhase === 'active' && context.storyContext.encounter ? `This happens during the battle with ${context.storyContext.encounter.name}.` : ''}
${context.bossDamage ? `The hero's action lands a real blow on the enemy — describe the hit!` : ''}
${context.damageTaken ? `The hero also gets hurt in the process (a bump, a scrape, a tumble — never gory). Weave that in.` : ''}
${context.crit === 'crit' ? 'THE ROLL WAS A NATURAL 20 — describe a SPECTACULAR, legendary success that will be retold at the dinner table.' : ''}
${context.crit === 'fumble' ? 'THE ROLL WAS A NATURAL 1 — describe a COMICAL fumble (slipping, tangled cape, startled chicken). Funny, never humiliating.' : ''}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.
Follow on from what just happened rather than restating the scene, and don't reuse the imagery or opening words of the lines above.`

  return generateText(prompt)
}
