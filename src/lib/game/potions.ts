import type { PotionId } from '@/types/game'
import type { Language } from '@/lib/ai/language'

// One-shot drinks: a cheap gold sink between gear tiers. The heal potion
// patches a hurt hero mid-quest; the luck potion is liquid courage for a
// roll that really matters.
export const HEAL_POTION_HP = 3
export const LUCK_POTION_BONUS = 2

export interface PotionDefinition {
  id: PotionId
  emoji: string
  price: number
  name: Record<Language, string>
  description: Record<Language, string>
}

export const POTION_CATALOG: PotionDefinition[] = [
  {
    id: 'heal',
    emoji: '🧪',
    price: 3,
    name: { da: 'Lægende Drik', en: 'Healing Draught' },
    description: {
      da: `Giver ${HEAL_POTION_HP} liv med det samme`,
      en: `Restores ${HEAL_POTION_HP} HP right away`,
    },
  },
  {
    id: 'luck',
    emoji: '🍀',
    price: 4,
    name: { da: 'Lykkedrik', en: 'Luck Potion' },
    description: {
      da: `Læg ${LUCK_POTION_BONUS} oven i dit næste terningslag`,
      en: `Adds ${LUCK_POTION_BONUS} to your next dice roll`,
    },
  },
]

export function potionDefinition(id: PotionId): PotionDefinition {
  return POTION_CATALOG.find(p => p.id === id)!
}
