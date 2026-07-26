import type { EquipSlot, LootItem, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export const SLOT_EMOJI: Record<EquipSlot, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  helmet: '🪖',
  trinket: '💍',
  boots: '🥾',
}

export const SLOT_LABEL: Record<EquipSlot, Record<Language, string>> = {
  weapon: { da: 'Våben', en: 'Weapon' },
  armor: { da: 'Rustning', en: 'Armor' },
  helmet: { da: 'Hjelm', en: 'Helmet' },
  trinket: { da: 'Smykke', en: 'Trinket' },
  boots: { da: 'Støvler', en: 'Boots' },
}

export const ALL_SLOTS: EquipSlot[] = ['weapon', 'armor', 'helmet', 'trinket', 'boots']

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
    agility: { da: 'Fjervesten', en: 'Feather Vest' },
    heart: { da: 'Venskabsbrynjen', en: 'Friendship Mail' },
  },
  helmet: {
    strength: { da: 'Tyrehjelmen', en: 'Bull Helm' },
    magic: { da: 'Krystalkronen', en: 'Crystal Crown' },
    agility: { da: 'Falkehætten', en: 'Falcon Hood' },
    heart: { da: 'Løvehjelmen', en: 'Lion Helm' },
  },
  trinket: {
    strength: { da: 'Kæmpens Ring', en: 'Ring of the Giant' },
    magic: { da: 'Månestenen', en: 'Moonstone' },
    agility: { da: 'Harens Amulet', en: 'Hare Amulet' },
    heart: { da: 'Solens Medaljon', en: 'Sun Medallion' },
  },
  boots: {
    strength: { da: 'Klippestøvlerne', en: 'Boulder Boots' },
    magic: { da: 'Tågeskoene', en: 'Mist Shoes' },
    agility: { da: 'Fjerstøvlerne', en: 'Feather Boots' },
    heart: { da: 'Vandrestøvlerne', en: 'Wander Boots' },
  },
}

// Generic English look for AI-named chest loot, so found gear also shows
// up on the hero in scene images. Also the fallback for any equipped item
// that reached the hero without a look of its own — a filled slot must never
// be painted as an empty one.
export const GENERIC_LOOK: Record<EquipSlot, string> = {
  weapon: 'an enchanted glowing weapon',
  armor: 'gleaming enchanted armor',
  helmet: 'an ornate enchanted helmet',
  trinket: 'a glowing magical amulet',
  boots: 'finely crafted adventurer boots',
}

export function fallbackLootName(slot: EquipSlot, stat: Stat, language: Language): string {
  return FALLBACK_NAMES[slot][stat][language]
}

export function rollLootSlot(): EquipSlot {
  return ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
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
    look: GENERIC_LOOK[slot],
  }
}
