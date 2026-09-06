import { generateText } from './gemini'
import { languageInstruction } from './language'
import type { StoryContext } from '@/types/ai'

interface CliffhangerContext {
  storyContext: StoryContext
  currentScene: string
}

// One hanging sentence for the moment the family puts the iPad down. It is
// read once on the home screen and once more on the "Sidst i eventyret…" page
// next time, so it should point forward at something concrete in THIS story,
// never wrap anything up, and never teach anything.
export async function generateCliffhanger({ storyContext, currentScene }: CliffhangerContext): Promise<string> {
  const nextHero = storyContext.characters.find(c => c.playerId === storyContext.currentPlayerId)
  const prompt = `You are a D&D dungeon master. The family is stopping for tonight, mid-adventure. Write the ONE sentence you say as you close the book — the line that makes the kids beg to play again next time.

${languageInstruction(storyContext.language, 'text')}

Adventure Style: ${storyContext.adventureStyle}
Quest: ${storyContext.quest?.title ?? 'unknown'} — ${storyContext.quest?.goal ?? ''}
${storyContext.quest?.villain ? `Villain: ${storyContext.quest.villain}` : ''}
${storyContext.encounter && storyContext.encounterPhase === 'active' ? `They stopped in the middle of a fight with ${storyContext.encounter.name}.` : ''}
Next hero to act when they return: ${nextHero?.characterName ?? 'unknown'}

What happened last (oldest first):
${storyContext.storyHistory.slice(-3).join('\n') || 'The adventure has only just begun.'}

Where they are right now: ${currentScene}

RULES:
- Exactly one sentence, at most 18 words, present tense, ending with an ellipsis (...).
- Tease the very next moment: a sound, a shadow, a door, a voice, a footstep — something concrete from THIS story, not a generic omen.
- Never resolve anything, never reveal what it is, never mention dice, rolls, levels, gold or game words.
- No lesson, no moral, no praise, no advice. Just the hook.
- Output the sentence only — no quotes, no label.`

  return generateText(prompt)
}
