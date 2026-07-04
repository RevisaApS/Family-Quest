import { generateJSON } from './gemini'
import type { EquipSlot, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface LootNameRequest {
  slot: EquipSlot
  stat: Stat
  language: Language
  sceneContext: string
}

const STAT_FLAVOR: Record<Stat, string> = {
  strength: 'raw power and might',
  magic: 'arcane magic and wonder',
  agility: 'speed and nimbleness',
  heart: 'courage and friendship',
}

// A magical item name that ties into the story the family is living right now.
export async function generateLootName(request: LootNameRequest): Promise<string> {
  const langName = request.language === 'da' ? 'Danish' : 'English'
  const prompt = `You are naming a magical treasure a child just found in a fantasy adventure.

Item type: ${request.slot}
The item radiates: ${STAT_FLAVOR[request.stat]}
Where it was found: ${request.sceneContext.slice(0, 300)}

Invent a short, exciting, child-friendly item name in ${langName} (2-4 words, e.g. "${request.language === 'da' ? 'Stormens Klinge' : 'Blade of Storms'}"). Tie it to where it was found when possible.

Return JSON: { "name": "the item name" }`

  const result = await generateJSON<{ name: string }>(prompt)
  return result.name
}
