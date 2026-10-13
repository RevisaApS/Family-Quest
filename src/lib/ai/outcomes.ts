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
  // This turn's blow takes the hero's last heart
  knockedOut?: boolean
  // Set when the hero spends the turn helping a knocked-out friend up
  rescueTargetName?: string
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
  // Helping a friend up is neither path: the choice stays open in the world
  if (!context.storyContext.dilemma || context.rescueTargetName) return ''
  return `THIS TURN ANSWERED THE SCENE'S CHOICE. Read what the hero actually did:
- If they took the tempting shortcut (grabbed the prize, skipped the hard part, walked on, left someone behind, hit back): they DO get the thing they reached for — and in the same breath the world complicates. An interesting plot twist that makes the quest harder and more exciting, arriving as a consequence in the world, never as a punishment, a scolding or a hint that they chose wrong.
- If they took the harder path and gave that prize up: honour it — what they did lands and matters in the story, and someone or something is different because of it. Sometimes, not every time, it also complicates: the gate shuts, the shortcut is gone, someone else walks off with the treasure.
EITHER WAY: no lesson, no moral, no virtue words, nobody praising or judging the hero's character, no narrator comment on the choice. Only what happens next.`
}

// The rescue always gets the friend up; the result only decides how well, so
// the usual "failure is a plot twist" line would tell the wrong story here.
const RESCUE_RESULTS: Record<OutcomeType, string> = {
  success: 'The rescue goes smoothly: they are back on their feet and feeling much better, ready for more.',
  partial: 'They get back up, still a bit wobbly, but they are okay.',
  failure: 'The first try goes comically wrong (a slip, a bump of heads, both tumbling over), but they still end up on their feet, very wobbly. A rescue always gets them up.',
}

function rescueRule(heroName: string | undefined, target: string, outcome: OutcomeType): string {
  return `THIS TURN IS A RESCUE: ${heroName} spends the turn helping their friend ${target}, who was knocked out and sitting dizzy on the ground, back onto their feet. Tell the rescue itself, warm and a little funny: how ${heroName} helps ${target} up and what they say or do. ${RESCUE_RESULTS[outcome]} Nobody gets hurt.`
}

// The blow that takes the last heart is a story moment of its own, told so
// an 8-year-old laughs instead of worrying.
function knockoutRule(heroName: string | undefined): string {
  return `THIS BLOW KNOCKS ${heroName} OUT: they have run out of hearts for now. Make it comic and gentle, never scary: seeing stars, little birds circling their head, sitting down dizzy with a wobbly smile. Nobody is badly hurt. End by making clear that their friends can help them back up.`
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
${currentCharacter?.rpg ? `What they carry: ${currentCharacter.rpg.gearNames.length ? currentCharacter.rpg.gearNames.join('; ') : 'NOTHING yet, empty hands: no weapon, no tools'}
Only what they carry exists: never describe them holding, drawing or using a weapon or tool that is not listed, even when their class or the action suggests one. If a kid's own idea names gear they lack, they improvise with something at hand (a stick for a sword, a pebble for an arrow).` : ''}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${context.rescueTargetName ? rescueRule(currentCharacter?.characterName, context.rescueTargetName, context.outcome) : OUTCOME_INSTRUCTIONS[context.outcome]}
${dilemmaOutcomeRule(context)}
${context.storyContext.encounterPhase === 'active' && context.storyContext.encounter ? `This happens during the battle with ${context.storyContext.encounter.name}.` : ''}
${context.bossDamage ? `The hero's action lands a real blow on the enemy — describe the hit!` : ''}
${context.damageTaken ? `The hero also gets hurt in the process (a bump, a scrape, a tumble — never gory). Weave that in.` : ''}
${context.knockedOut ? knockoutRule(currentCharacter?.characterName) : ''}
${context.crit === 'crit' ? 'THE ROLL WAS A NATURAL 20 — describe a SPECTACULAR, legendary success that will be retold at the dinner table.' : ''}
${context.crit === 'fumble' ? 'THE ROLL WAS A NATURAL 1 — describe a COMICAL fumble (slipping, tangled cape, startled chicken). Funny, never humiliating.' : ''}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.
Follow on from what just happened rather than restating the scene, and don't reuse the imagery or opening words of the lines above.`

  return generateText(prompt, 'story')
}
