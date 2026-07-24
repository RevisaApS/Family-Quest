import { SchemaType, type ResponseSchema, type Schema } from '@google/generative-ai'
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
    c.rpg.petName ? `their loyal pet ${c.rpg.petName} at their side` : '',
    c.rpg.knockedOut ? 'currently knocked out and needs help' : '',
  ].filter(Boolean).join(', ')
  return `${base} — ${details}`
}

// Classic three-act build between the quest's milestones. milestonesDone
// doubles as the chapter index: 0 = trail, 1 = obstacle (+ twist), 2 = finale.
const CHAPTER_BEATS = [
  `CHAPTER 1 — THE TRAIL: the heroes follow the villain's trail. Scenes are about discovery: strange tracks, worried locals, clues about the villain's plan.`,
  `CHAPTER 2 — THE OBSTACLE: something big stands between the heroes and the villain. Somewhere in this chapter, spring a TWIST that changes how the quest looks — a false lead, a trap, or a surprising truth about the villain.`,
  `CHAPTER 3 — THE CONFRONTATION: the villain's lair is near. Scenes grow tenser and darker; everything builds toward the final showdown.`,
]

function questInstruction(context: StoryContext): string {
  if (context.isFirstScene) {
    return `THIS IS THE OPENING SCENE — the call to adventure. Three extra jobs:
1. Introduce a memorable QUEST-GIVER (a desperate villager, a scarred old knight, a talking raven — pick something fitting) who hands the family their mission and makes clear what is at stake. NO combat in this scene: the heroes' first choice is about the story, not a fight.
2. Invent a clear, exciting QUEST the family pursues this whole adventure (find something, rescue someone, break a curse). Return "questTitle" (2-5 words) and "questGoal" (one kid-friendly sentence) in the story language.
3. Invent the VILLAIN behind it all and have the quest-giver speak their name with dread. Return "villainName" in the story language. The villain must NOT appear in person yet — only their shadow: rumors, traces, fear.`
  }
  if (context.quest) {
    const villain = context.quest.villain
      ? ` The villain ${context.quest.villain} looms over everything — weave in their traces, whispers and servants long before they appear in person.`
      : ''
    return `The family's quest: "${context.quest.title}" — ${context.quest.goal} (${context.quest.milestonesDone}/3 milestones done).${villain}
${CHAPTER_BEATS[Math.min(context.quest.milestonesDone, CHAPTER_BEATS.length - 1)]}
Every scene should feel like progress toward or a twist on this goal.`
  }
  return ''
}

function encounterInstruction(context: StoryContext): string {
  switch (context.encounterPhase) {
    case 'arriving-monster':
      return `IMPORTANT: In THIS scene a monster appears and blocks the heroes' path — ${context.quest?.villain ? `a servant or creature of the villain ${context.quest.villain}, proof the heroes are getting closer` : 'a dramatic twist tied to the quest'}. Return "encounterName" with the monster's name in the story language. ${MONSTER_TONE[context.adventureStyle]}`
    case 'arriving-boss':
      return `IMPORTANT: In THIS scene, ${context.quest?.villain ? `the villain ${context.quest.villain}` : `the quest's big villain`} finally appears in person for the final showdown the whole adventure has built toward! ${MONSTER_TONE[context.adventureStyle]} Return "encounterName" with the villain's name in the story language${context.quest?.villain ? ` (it must be ${context.quest.villain})` : ''}.`
    case 'active': {
      const base = `The heroes are mid-battle with ${context.encounter?.name} (${context.encounter?.hp}/${context.encounter?.maxHp} HP left). The scene must continue this fight — describe the enemy reacting and the battle evolving.`
      if (context.encounter?.announceEnrage && context.encounter.weakStat) {
        return `${base}
IMPORTANT: ${context.encounter.name} is badly wounded and in THIS scene TRANSFORMS into a desperate, more dramatic second form — but the transformation cracks its defenses and reveals a glowing WEAK SPOT. Describe the transformation vividly, and make clear that attacks using ${context.encounter.weakStat} (in the story language) now strike the weak spot and hit extra hard. Thrilling, never gory.`
      }
      if (context.encounter?.enraged && context.encounter.weakStat) {
        return `${base} The enemy is in its enraged second form with a revealed weak spot vulnerable to ${context.encounter.weakStat} — keep the weak spot visible in the scene.`
      }
      return base
    }
    case 'just-defeated':
      return `The heroes just defeated ${context.encounter?.name}! Open with the victory's aftermath, then push the quest forward.`
    default:
      return ''
  }
}

// The schema has to declare exactly the fields this particular call asks for:
// the model returns nothing that isn't declared, so a fixed schema would
// silently swallow the quest and villain on the opening scene.
function sceneSchema(context: StoryContext): ResponseSchema {
  const properties: Record<string, Schema> = {
    narration: { type: SchemaType.STRING },
    imagePrompt: { type: SchemaType.STRING },
    suggestedNextPlayer: { type: SchemaType.STRING },
  }
  const required = ['narration', 'imagePrompt', 'suggestedNextPlayer']

  if (context.isFirstScene) {
    properties.questTitle = { type: SchemaType.STRING }
    properties.questGoal = { type: SchemaType.STRING }
    properties.villainName = { type: SchemaType.STRING }
    required.push('questTitle', 'questGoal', 'villainName')
  }

  if (context.encounterPhase === 'arriving-monster' || context.encounterPhase === 'arriving-boss') {
    properties.encounterName = { type: SchemaType.STRING }
    required.push('encounterName')
  }

  return { type: SchemaType.OBJECT, properties, required }
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
  "suggestedNextPlayer": "the player ID of whichever character would most naturally act next based on the story context"${context.isFirstScene ? ',\n  "questTitle": "the quest\'s short title",\n  "questGoal": "one sentence describing the goal",\n  "villainName": "the villain\'s name"' : ''}${context.encounterPhase === 'arriving-monster' || context.encounterPhase === 'arriving-boss' ? ',\n  "encounterName": "the enemy\'s name"' : ''}
}

The imagePrompt must ALWAYS be written in English (it goes to an image model), regardless of the story language. Describe the location, mood and any creatures — do NOT describe the heroes' appearance, that is added separately.

Choose suggestedNextPlayer based on the narrative — who would be most relevant to act in this scene?
Available player IDs: ${context.characters.map(c => c.playerId).join(', ')}

Make the narration engaging and end with a moment that calls for action.`

  return generateJSON<GeneratedScene>(prompt, sceneSchema(context))
}
