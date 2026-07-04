import type { EquipSlot, LootItem, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export const SLOT_EMOJI: Record<EquipSlot, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  trinket: '💍',
}

export const SLOT_LABEL: Record<EquipSlot, Record<Language, string>> = {
  weapon: { da: 'Våben', en: 'Weapon' },
  armor: { da: 'Rustning', en: 'Armor' },
  trinket: { da: 'Smykke', en: 'Trinket' },
}

// Fallback treasure names when the AI can't be reached — kids still get loot.
const FALLBACK_NAMES: Record<EquipSlot, Record<Stat, Record<Language, string>>> = {
  weapon: {
    strength: { da: 'Tordenhammeren', en: 'Thunder Hammer' },
    magic: { da: 'Gnistestaven', en: 'Spark Staff' },
    agility: { da: 'Vindens Dolk', en: 'Dagger of the Wind' },
    heart: { da: 'Modets Sværd', en: 'Sword of Courage' },
  },
  armor: {
    strength: { da: 'Bjørneskjoldet', en: 'Bear Shield' },
    magic: { da: 'Stjernekappen', en: 'Cloak of Stars' },
    agility: { da: 'Fjerstøvlerne', en: 'Feather Boots' },
    heart: { da: 'Venskabsbrynjen', en: 'Friendship Mail' },
  },
  trinket: {
    strength: { da: 'Kæmpens Ring', en: 'Ring of the Giant' },
    magic: { da: 'Månestenen', en: 'Moonstone' },
    agility: { da: 'Harens Amulet', en: 'Hare Amulet' },
    heart: { da: 'Solens Medaljon', en: 'Sun Medallion' },
  },
}

export function fallbackLootName(slot: EquipSlot, stat: Stat, language: Language): string {
  return FALLBACK_NAMES[slot][stat][language]
}

export function rollLootSlot(): EquipSlot {
  const slots: EquipSlot[] = ['weapon', 'armor', 'trinket']
  return slots[Math.floor(Math.random() * slots.length)]
}

export function rollLootStat(): Stat {
  const stats: Stat[] = ['strength', 'magic', 'agility', 'heart']
  return stats[Math.floor(Math.random() * stats.length)]
}

export function createLoot(slot: EquipSlot, stat: Stat, bonus: number, name: string): LootItem {
  return {
    id: crypto.randomUUID(),
    slot,
    stat,
    bonus,
    name,
    emoji: SLOT_EMOJI[slot],
  }
}
