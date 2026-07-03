import { generateJSON } from './gemini'
import { languageInstruction } from './language'
import type { GeneratedScene, StoryContext } from '@/types/ai'

const STYLE_PROMPTS = {
  whimsical: "Keep the tone gentle and child-friendly for ages 4-7. No scary moments. Problems are solved with creativity and kindness. Use bright, cheerful imagery.",
  realistic: "Create exciting adventure with mild tension for ages 7-12. Heroes face real challenges but always prevail. Dynamic and engaging but not frightening.",
  dark: "Include complex themes and real consequences for ages 13+. Atmosphere can be moody and mysterious. Appropriate tension and stakes.",
}

export async function generateScene(context: StoryContext): Promise<GeneratedScene> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)

  const prompt = `You are a D&D dungeon master creating an interactive story for a family.

Adventure Style: ${context.adventureStyle}
${STYLE_PROMPTS[context.adventureStyle]}

${languageInstruction(context.language)}

Current Characters:
${context.characters.map(c => `- ${c.characterName} the ${c.class} (played by ${c.playerName})`).join('\n')}

Story So Far:
${context.storyHistory.slice(-5).join('\n') || 'The adventure is just beginning.'}

Current Player: ${currentCharacter?.playerName} as ${currentCharacter?.characterName}

Generate the next scene. Return JSON:
{
  "narration": "2-3 sentences describing the scene, what the characters see and hear",
  "imagePrompt": "A detailed prompt for generating an image of this scene",
  "suggestedNextPlayer": "the player ID of whichever character would most naturally act next based on the story context"
}

Choose suggestedNextPlayer based on the narrative — who would be most relevant to act in this scene?
Available player IDs: ${context.characters.map(c => c.playerId).join(', ')}

Make the narration engaging and end with a moment that calls for action.`

  return generateJSON<GeneratedScene>(prompt)
}
