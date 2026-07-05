import { generateJSON } from './gemini'
import { languageInstruction } from './language'
import type { AdventureStyle } from '@/types/game'
import type { GeneratedScene, StoryContext } from '@/types/ai'

const STYLE_PROMPTS = {
  whimsical: "Keep the tone gentle and child-friendly for ages 4-7. No scary moments. Problems are solved with creativity and kindness. Use bright, cheerful imagery.",
  realistic: "Create a thrilling adventure for ages 7-12 with a cool, slightly dark edge: fearsome monsters, haunted ruins, cursed forests, storms and shadow. Real danger and real stakes — the heroes earn their victories. Exciting and a bit spooky, but never gory or truly disturbing.",
  dark: "Include complex themes and real consequences for ages 13+. Atmosphere can be moody and mysterious. Appropriate tension and stakes.",
}

// How menacing may monsters be? Tuned per style so 7-12 gets the cool,
// scary-ish monsters kids that age actually want.
const MONSTER_TONE: Record<AdventureStyle, string> = {
  whimsical: 'The monster is silly and exciting, beatable, and not scary at all.',
  realistic: 'The monster is genuinely menacing and cool — fangs, glowing eyes, a name kids will remember — dangerous but beatable, never gory.',
  dark: 'The monster is genuinely threatening with real menace, but beatable.',
}

function describeHero(c: StoryContext['characters'][number]): string {
  const base = `- ${c.characterName} the ${c.class} (played by ${c.playerName})`
  if (!c.rpg) return base
  const details = [
    `level ${c.rpg.level}`,
    `${c.rpg.hp}/${c.rpg.maxHp} HP`,
    c.rpg.skillNames.length ? `powers: ${c.rpg.skillNames.join(', ')}` : '',
    c.rpg.gearNames.length ? `equipment: ${c.rpg.gearNames.join(', ')}` : '',
    c.rpg.knockedOut ? 'currently knocked out and needs help' : '',
  ].filter(Boolean).join(', ')
  return `${base} — ${details}`
}

function questInstruction(context: StoryContext): string {
  if (context.isFirstScene) {
    return `THIS IS THE OPENING SCENE. Two extra jobs:
1. Invent a clear, exciting QUEST the family pursues this whole adventure (find something, rescue someone, break a curse). Return "questTitle" (2-5 words) and "questGoal" (one kid-friendly sentence) in the story language.
2. START WITH ACTION: a small monster attacks or blocks the way in this very first scene — the kids must fight from minute one, no slow build-up. Return "encounterName" with the monster's name in the story language. ${MONSTER_TONE[context.adventureStyle]}`
  }
  if (context.quest) {
    return `The family's quest: "${context.quest.title}" — ${context.quest.goal} (${context.quest.milestonesDone}/3 milestones done). Every scene should feel like progress toward or a twist on this goal.`
  }
  return ''
}

function encounterInstruction(context: StoryContext): string {
  switch (context.encounterPhase) {
    case 'arriving-monster':
      return `IMPORTANT: In THIS scene a new monster appears and blocks the heroes' path — a dramatic mid-quest twist tied to the quest. Return "encounterName" with the monster's name in the story language. ${MONSTER_TONE[context.adventureStyle]}`
    case 'arriving-boss':
      return `IMPORTANT: In THIS scene, the quest's big villain finally appears for the final showdown! Introduce a dramatic boss. ${MONSTER_TONE[context.adventureStyle]} Return "encounterName" with the villain's name in the story language.`
    case 'active':
      return `The heroes are mid-battle with ${context.encounter?.name} (${context.encounter?.hp}/${context.encounter?.maxHp} HP left). The scene must continue this fight — describe the enemy reacting and the battle evolving.`
    case 'just-defeated':
      return `The heroes just defeated ${context.encounter?.name}! Open with the victory's aftermath, then push the quest forward.`
    default:
      return ''
  }
}

export async function generateScene(context: StoryContext): Promise<GeneratedScene> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)

  const prompt = `You are a D&D dungeon master creating an interactive story for a family.

Adventure Style: ${context.adventureStyle}
${STYLE_PROMPTS[context.adventureStyle]}

${languageInstruction(context.language)}

Current Characters:
${context.characters.map(describeHero).join('\n')}

Weave the heroes' powers and equipment into the story when it fits — kids love hearing their gear mentioned.

Story So Far:
${context.storyHistory.slice(-5).join('\n') || 'The adventure is just beginning.'}

Current Player: ${currentCharacter?.playerName} as ${currentCharacter?.characterName}

${questInstruction(context)}

${encounterInstruction(context)}

Generate the next scene. Return JSON:
{
  "narration": "2-3 sentences describing the scene, what the characters see and hear",
  "imagePrompt": "A detailed prompt for generating an image of this scene",
  "suggestedNextPlayer": "the player ID of whichever character would most naturally act next based on the story context"${context.isFirstScene ? ',\n  "questTitle": "the quest\'s short title",\n  "questGoal": "one sentence describing the goal",\n  "encounterName": "the opening monster\'s name"' : ''}${context.encounterPhase === 'arriving-monster' || context.encounterPhase === 'arriving-boss' ? ',\n  "encounterName": "the enemy\'s name"' : ''}
}

The imagePrompt must ALWAYS be written in English (it goes to an image model), regardless of the story language. Describe the location, mood and any creatures — do NOT describe the heroes' appearance, that is added separately.

Choose suggestedNextPlayer based on the narrative — who would be most relevant to act in this scene?
Available player IDs: ${context.characters.map(c => c.playerId).join(', ')}

Make the narration engaging and end with a moment that calls for action.`

  return generateJSON<GeneratedScene>(prompt)
}
