import { generateJSON } from './gemini'
import type { AdventureStyle, EquipSlot, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface LootNameRequest {
  slot: EquipSlot
  stat: Stat
  language: Language
  sceneContext: string
  style?: AdventureStyle
}

export interface GeneratedLootName {
  name: string
  // English visual description, feeds both scene art and the item's image
  look: string
}

const STAT_FLAVOR: Record<Stat, string> = {
  strength: 'raw power and might',
  magic: 'arcane magic and wonder',
  agility: 'speed and nimbleness',
  heart: 'courage and friendship',
}

const NAME_TONE: Record<AdventureStyle, string> = {
  whimsical: 'sweet, friendly and playful',
  realistic: 'cool and a little fearsome — think storm, shadow, fang, ember, dragon',
  dark: 'mysterious and powerful',
}

// A magical item name that ties into the story the family is living right now.
export async function generateLootName(request: LootNameRequest): Promise<GeneratedLootName> {
  const langName = request.language === 'da' ? 'Danish' : 'English'
  const tone = NAME_TONE[request.style ?? 'realistic']
  const prompt = `You are naming a magical treasure a child just found in a fantasy adventure.

Item type: ${request.slot}
The item radiates: ${STAT_FLAVOR[request.stat]}
Where it was found: ${request.sceneContext.slice(0, 300)}

Invent:
1. "name": a short, exciting item name in ${langName} (2-4 words, e.g. "${request.language === 'da' ? 'Stormens Klinge' : 'Blade of Storms'}"). Make it ${tone}. Tie it to where it was found when possible. Child-appropriate.
2. "look": a visual description of the item in English (max 12 words) that matches the name, e.g. "a curved blade crackling with tiny storm clouds".

Return JSON: { "name": "the item name", "look": "the visual description" }`

  return generateJSON<GeneratedLootName>(prompt)
}
