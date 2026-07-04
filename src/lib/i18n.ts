import type { Language } from '@/lib/ai/language'
import type { Stat } from '@/types/game'

// Kid-facing UI strings for the RPG layer. The story itself is localized by
// the AI; these are the fixed labels around it.
const STRINGS = {
  levelUp: { da: 'Niveau op!', en: 'Level Up!' },
  pickPower: { da: 'Vælg din nye kraft', en: 'Pick your new power' },
  treasureFound: { da: 'Du fandt en skat!', en: 'You found treasure!' },
  tapToOpen: { da: 'Tryk på kisten for at åbne den', en: 'Tap the chest to open it' },
  equip: { da: 'Tag på', en: 'Equip' },
  replaceQuestion: { da: 'Byt med', en: 'Swap with' },
  keepCurrent: { da: 'Behold', en: 'Keep' },
  knockedOut: { da: 'er slået omkuld!', en: 'is knocked out!' },
  rescuedBy: { da: 'hjælper', en: 'helps' },
  backUp: { da: 'på benene igen!', en: 'back on their feet!' },
  soloRecover: { da: 'rejser sig igen!', en: 'gets back up!' },
  bossAppears: { da: 'BOSSKAMP!', en: 'BOSS FIGHT!' },
  bossDefeated: { da: 'Bossen er besejret!', en: 'The boss is defeated!' },
  victory: { da: 'Eventyret er fuldført!', en: 'Adventure complete!' },
  victorySub: { da: 'I er ægte helte!', en: 'You are true heroes!' },
  keepPlaying: { da: 'Spil videre', en: 'Keep playing' },
  newAdventure: { da: 'Nyt eventyr', en: 'New adventure' },
  damageTaken: { da: 'liv mistet', en: 'damage taken' },
  level: { da: 'Niv.', en: 'Lv.' },
  rare: { da: 'Sjælden!', en: 'Rare!' },
  shop: { da: 'Butikken', en: 'The Shop' },
  buy: { da: 'Køb', en: 'Buy' },
  equipped: { da: 'I brug', en: 'Equipped' },
  yourGold: { da: 'Dit guld', en: 'Your gold' },
  goldFound: { da: 'Du fandt guld!', en: 'You found gold!' },
  takeGold: { da: 'Tag guldet', en: 'Take the gold' },
  bossGoldReward: { da: 'guld til alle helte!', en: 'gold for every hero!' },
  inventory: { da: 'Udstyr', en: 'Inventory' },
  skills: { da: 'Kræfter', en: 'Powers' },
  empty: { da: 'Tom', en: 'Empty' },
  close: { da: 'Luk', en: 'Close' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, language: Language): string {
  return STRINGS[key][language]
}

const STAT_LABELS: Record<Stat, Record<Language, string>> = {
  strength: { da: 'Styrke', en: 'Strength' },
  magic: { da: 'Magi', en: 'Magic' },
  agility: { da: 'Behændighed', en: 'Agility' },
  heart: { da: 'Hjerte', en: 'Heart' },
}

export function statLabel(stat: Stat, language: Language): string {
  return STAT_LABELS[stat][language]
}
