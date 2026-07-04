import type { EquipSlot, LootItem, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'
import { SLOT_EMOJI } from './loot'

// The shop economy in one glance:
//   tier 0 →  1 gold  +0  hilariously bad starter gear (but it shows in the art!)
//   tier 1 →  5 gold  +1  honest adventurer kit (~2-3 good turns)
//   tier 2 → 12 gold  +2  serious gear (mid-adventure goal)
//   tier 3 → 25+ gold +3  legendary trophies — realistic after the boss payout
// The Golden Helm is deliberately the most expensive thing in the game.
export interface ShopItem {
  id: string
  slot: EquipSlot
  tier: 0 | 1 | 2 | 3
  price: number
  stat: Stat
  bonus: number
  name: Record<Language, string>
  look: string // English, feeds the image prompts
}

export const SHOP_CATALOG: ShopItem[] = [
  // Weapons — strength
  { id: 'shop-weapon-0', slot: 'weapon', tier: 0, price: 1, stat: 'strength', bonus: 0,
    name: { da: 'Skæv Pind', en: 'Crooked Stick' }, look: 'a crooked wooden stick held like a sword' },
  { id: 'shop-weapon-1', slot: 'weapon', tier: 1, price: 5, stat: 'strength', bonus: 1,
    name: { da: 'Jernsværd', en: 'Iron Sword' }, look: 'a simple iron sword' },
  { id: 'shop-weapon-2', slot: 'weapon', tier: 2, price: 12, stat: 'strength', bonus: 2,
    name: { da: 'Sølvøksen', en: 'Silver Axe' }, look: 'a gleaming silver battle axe' },
  { id: 'shop-weapon-3', slot: 'weapon', tier: 3, price: 25, stat: 'strength', bonus: 3,
    name: { da: 'Flammeklingen', en: 'Flame Blade' }, look: 'a legendary sword with a blade of living fire' },

  // Armor — heart
  { id: 'shop-armor-0', slot: 'armor', tier: 0, price: 1, stat: 'heart', bonus: 0,
    name: { da: 'Kartoffelsækken', en: 'Potato Sack' }, look: 'a patched potato-sack tunic with rope belt' },
  { id: 'shop-armor-1', slot: 'armor', tier: 1, price: 5, stat: 'heart', bonus: 1,
    name: { da: 'Læderbrynjen', en: 'Leather Jerkin' }, look: 'a sturdy leather jerkin' },
  { id: 'shop-armor-2', slot: 'armor', tier: 2, price: 12, stat: 'heart', bonus: 2,
    name: { da: 'Kædebrynjen', en: 'Chainmail' }, look: 'shining chainmail armor' },
  { id: 'shop-armor-3', slot: 'armor', tier: 3, price: 25, stat: 'heart', bonus: 3,
    name: { da: 'Drageskælsrustningen', en: 'Dragonscale Armor' }, look: 'magnificent armor of shimmering red dragon scales' },

  // Helmets — heart/strength, crowned by the Golden Helm
  { id: 'shop-helmet-0', slot: 'helmet', tier: 0, price: 1, stat: 'heart', bonus: 0,
    name: { da: 'Gryden', en: 'Cooking Pot' }, look: 'an old dented cooking pot worn as a helmet' },
  { id: 'shop-helmet-1', slot: 'helmet', tier: 1, price: 5, stat: 'heart', bonus: 1,
    name: { da: 'Læderhuen', en: 'Leather Cap' }, look: 'a snug leather cap' },
  { id: 'shop-helmet-2', slot: 'helmet', tier: 2, price: 12, stat: 'strength', bonus: 2,
    name: { da: 'Vikingehjelmen', en: 'Viking Helm' }, look: 'a horned viking helmet' },
  { id: 'shop-helmet-3', slot: 'helmet', tier: 3, price: 30, stat: 'heart', bonus: 3,
    name: { da: 'Den Gyldne Hjelm', en: 'The Golden Helm' }, look: 'a magnificent shining golden helmet with wing ornaments' },

  // Trinkets — magic
  { id: 'shop-trinket-0', slot: 'trinket', tier: 0, price: 1, stat: 'magic', bonus: 0,
    name: { da: 'Blank Sten', en: 'Shiny Pebble' }, look: 'a shiny pebble on a string around the neck' },
  { id: 'shop-trinket-1', slot: 'trinket', tier: 1, price: 5, stat: 'magic', bonus: 1,
    name: { da: 'Glasperlen', en: 'Glass Bead' }, look: 'a glittering glass bead amulet' },
  { id: 'shop-trinket-2', slot: 'trinket', tier: 2, price: 12, stat: 'magic', bonus: 2,
    name: { da: 'Måneringen', en: 'Moon Ring' }, look: 'a silver ring glowing with pale moonlight' },
  { id: 'shop-trinket-3', slot: 'trinket', tier: 3, price: 25, stat: 'magic', bonus: 3,
    name: { da: 'Dragehjertet', en: 'Dragonheart Amulet' }, look: 'a pulsing crimson dragonheart amulet' },

  // Boots — agility
  { id: 'shop-boots-0', slot: 'boots', tier: 0, price: 1, stat: 'agility', bonus: 0,
    name: { da: 'Træskoene', en: 'Wooden Clogs' }, look: 'clunky worn wooden clogs' },
  { id: 'shop-boots-1', slot: 'boots', tier: 1, price: 5, stat: 'agility', bonus: 1,
    name: { da: 'Læderstøvlerne', en: 'Leather Boots' }, look: 'well-worn leather boots' },
  { id: 'shop-boots-2', slot: 'boots', tier: 2, price: 12, stat: 'agility', bonus: 2,
    name: { da: 'Elverstøvlerne', en: 'Elven Boots' }, look: 'elegant green elven boots' },
  { id: 'shop-boots-3', slot: 'boots', tier: 3, price: 25, stat: 'agility', bonus: 3,
    name: { da: 'Stormstøvlerne', en: 'Storm Boots' }, look: 'boots crackling with tiny lightning bolts' },
]

export function shopItemsForSlot(slot: EquipSlot): ShopItem[] {
  return SHOP_CATALOG.filter(item => item.slot === slot)
}

export function toLootItem(shopItem: ShopItem, language: Language): LootItem {
  return {
    id: shopItem.id,
    slot: shopItem.slot,
    stat: shopItem.stat,
    bonus: shopItem.bonus,
    name: shopItem.name[language],
    emoji: SLOT_EMOJI[shopItem.slot],
    look: shopItem.look,
  }
}
