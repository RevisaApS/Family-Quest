import type { CharacterClass, EquipSlot, LootItem } from '@/types/game'
import { ALL_SLOTS, GENERIC_LOOK } from './loot'

type Gender = 'male' | 'female' | 'neutral'

// Image prompts are always English — image models follow English best,
// regardless of the story language.
//
// These looks are deliberately GEAR-FREE. Heroes start the adventure owning
// nothing, and the picture has to say so: when the warrior was painted in
// shining armor with a sword and shield from turn one, buying the Crooked
// Stick changed nothing a kid could see. Weapons, armor, helmets, trinkets
// and boots now only ever enter a prompt by being equipped.
const CLASS_LOOK: Record<CharacterClass, string> = {
  warrior: 'warrior in a plain undyed linen tunic and cloth arm wraps',
  wizard: 'wizard apprentice in a plain patched cloth robe',
  rogue: 'rogue in plain dark travelling clothes and a simple cloth hood',
  ranger: 'ranger in a plain leaf-green cloth tunic',
}

// What owning nothing looks like, slot by slot. Spelled out per slot rather
// than as one blanket "unequipped", so a hero who owns only the Crooked Stick
// is still bare-headed and barefoot in the painting.
const EMPTY_SLOT_LOOK: Record<EquipSlot, string> = {
  weapon: 'empty hands and no weapon',
  armor: 'no armor, only plain cloth',
  helmet: 'a bare head, no helmet',
  trinket: 'no amulet or jewellery',
  boots: 'bare feet, no boots',
}

// The player's real age shapes their hero: kids get kid heroes,
// grown-ups get grown-up heroes.
function personWord(gender: Gender, age: number): string {
  if (age < 13) {
    return { male: 'young boy', female: 'young girl', neutral: 'young child' }[gender]
  }
  if (age < 18) {
    return { male: 'teenage boy', female: 'teenage girl', neutral: 'teenager' }[gender]
  }
  return { male: 'adult man', female: 'adult woman', neutral: 'adult' }[gender]
}

// Map the player's random HSL accent color to a paintable color word so each
// kid's hero wears "their" color in every scene.
export function colorNameFromHsl(hsl: string): string {
  const hue = Number(hsl.match(/hsl\((\d+(?:\.\d+)?)/)?.[1] ?? NaN)
  if (Number.isNaN(hue)) return 'blue'
  if (hue < 20) return 'red'
  if (hue < 45) return 'orange'
  if (hue < 70) return 'golden yellow'
  if (hue < 160) return 'green'
  if (hue < 200) return 'teal'
  if (hue < 260) return 'blue'
  if (hue < 300) return 'purple'
  if (hue < 340) return 'pink'
  return 'red'
}

export type GearLooks = Partial<Record<EquipSlot, string>>

// Equipped items → paintable descriptions, one per filled slot. An item that
// somehow arrived without a look of its own still counts as gear: it falls
// back to the generic look for its slot rather than dropping out and letting
// the prompt claim the hero's hands are empty.
export function gearLooksFromEquipment(
  equipment: Partial<Record<EquipSlot, LootItem>>
): GearLooks {
  const looks: GearLooks = {}
  for (const slot of ALL_SLOTS) {
    const item = equipment[slot]
    if (item) looks[slot] = item.look || GENERIC_LOOK[slot]
  }
  return looks
}

// The visual description reused in every image prompt, so the same hero looks
// like the same hero across the whole adventure — and so the gear they earned
// is spelled out item by item, alongside the slots that are still empty.
export function heroVisualDescription(
  characterName: string,
  characterClass: CharacterClass,
  gender: Gender,
  playerColorHsl: string,
  age: number,
  gear: GearLooks = {},
  petLook?: string
): string {
  const color = colorNameFromHsl(playerColorHsl)
  const article = /^[aeiou]/.test(color) ? 'an' : 'a'

  const worn = ALL_SLOTS.filter(slot => gear[slot]).map(slot => gear[slot]!)
  const empty = ALL_SLOTS.filter(slot => !gear[slot]).map(slot => EMPTY_SLOT_LOOK[slot])

  const parts = [
    `${characterName}, a brave ${personWord(gender, age)} ${CLASS_LOOK[characterClass]}, wearing ${article} ${color} cape`,
  ]
  if (worn.length) parts.push(`equipped with ${worn.join(' and ')}`)
  if (empty.length) {
    parts.push(`${worn.length ? 'and nothing else' : 'carrying nothing at all'}: ${empty.join(', ')}`)
  }
  if (petLook) parts.push(`accompanied by ${petLook}`)
  return parts.join(', ')
}
