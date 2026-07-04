import { generateJSON } from './gemini'
import { languageInstruction } from './language'
import type { GeneratedScene, StoryContext } from '@/types/ai'

const STYLE_PROMPTS = {
  whimsical: "Keep the tone gentle and child-friendly for ages 4-7. No scary moments. Problems are solved with creativity and kindness. Use bright, cheerful imagery.",
  realistic: "Create exciting adventure with mild tension for ages 7-12. Heroes face real challenges but always prevail. Dynamic and engaging but not frightening.",
  dark: "Include complex themes and real consequences for ages 13+. Atmosphere can be moody and mysterious. Appropriate tension and stakes.",
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

function bossInstruction(context: StoryContext): string {
  switch (context.bossPhase) {
    case 'arriving':
      return `IMPORTANT: In THIS scene, the adventure's big villain finally appears! Introduce a dramatic (but not too scary) boss the heroes must face together. Also return a "bossName" field in the JSON with the villain's name in the story language.`
    case 'active':
      return `The heroes are mid-battle with the boss: ${context.boss?.name} (${context.boss?.hp}/${context.boss?.maxHp} HP left). The scene must continue this confrontation — describe the boss reacting and the fight evolving.`
    case 'defeated':
      return `The boss ${context.boss?.name} has been defeated! The story continues in celebration/aftermath — new smaller adventures can begin.`
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

${bossInstruction(context)}

Generate the next scene. Return JSON:
{
  "narration": "2-3 sentences describing the scene, what the characters see and hear",
  "imagePrompt": "A detailed prompt for generating an image of this scene",
  "suggestedNextPlayer": "the player ID of whichever character would most naturally act next based on the story context"${context.bossPhase === 'arriving' ? ',\n  "bossName": "the villain\'s name"' : ''}
}

The imagePrompt must ALWAYS be written in English (it goes to an image model), regardless of the story language. Describe the location, mood and any creatures — do NOT describe the heroes' appearance, that is added separately.

Choose suggestedNextPlayer based on the narrative — who would be most relevant to act in this scene?
Available player IDs: ${context.characters.map(c => c.playerId).join(', ')}

Make the narration engaging and end with a moment that calls for action.`

  return generateJSON<GeneratedScene>(prompt)
}
