import type { Pet, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

// Pet companions — the dream purchase kids save up for. Each pet boosts one
// stat and, via its `look`, walks beside the hero in every generated scene.
// Priced just under a legendary, so bringing home a wolf pup means going
// without the Flame Blade.
export const PET_PRICE = 10

export interface PetDefinition {
  id: string
  emoji: string
  price: number
  stat: Stat
  bonus: number
  name: Record<Language, string>
  look: string // English, feeds the image prompts
}

export const PET_CATALOG: PetDefinition[] = [
  {
    id: 'pet-wolf', emoji: '🐺', price: PET_PRICE, stat: 'strength', bonus: 1,
    name: { da: 'Ulveungen', en: 'Wolf Pup' },
    look: 'a small loyal grey wolf pup trotting at their side',
  },
  {
    id: 'pet-dragon', emoji: '🐉', price: PET_PRICE, stat: 'magic', bonus: 1,
    name: { da: 'Drageungen', en: 'Baby Dragon' },
    look: 'a tiny friendly red baby dragon fluttering beside them',
  },
  {
    id: 'pet-fox', emoji: '🦊', price: PET_PRICE, stat: 'agility', bonus: 1,
    name: { da: 'Ræveungen', en: 'Fox Kit' },
    look: 'a quick orange fox kit darting around their feet',
  },
  {
    id: 'pet-lion', emoji: '🦁', price: PET_PRICE, stat: 'heart', bonus: 1,
    name: { da: 'Løveungen', en: 'Lion Cub' },
    look: 'a brave golden lion cub walking proudly beside them',
  },
]

// Kids name their own pet at the shop counter; a blank name falls back to
// the catalog name.
export function toPet(def: PetDefinition, language: Language, customName?: string): Pet {
  return {
    id: def.id,
    name: customName?.trim() || def.name[language],
    emoji: def.emoji,
    stat: def.stat,
    bonus: def.bonus,
    look: def.look,
  }
}
