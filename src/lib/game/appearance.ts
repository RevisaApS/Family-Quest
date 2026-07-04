import type { CharacterClass } from '@/types/game'

type Gender = 'male' | 'female' | 'neutral'

// Image prompts are always English — image models follow English best,
// regardless of the story language.
const CLASS_LOOK: Record<CharacterClass, string> = {
  warrior: 'knight in shining armor holding a sword and round shield',
  wizard: 'wizard in a starry robe and pointed hat holding a glowing staff',
  rogue: 'rogue in a hooded cloak with soft leather boots and a small dagger',
  ranger: 'ranger with a wooden bow, quiver of arrows and a leaf-green tunic',
}

const GENDER_WORD: Record<Gender, string> = {
  male: 'boy',
  female: 'girl',
  neutral: 'child',
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

// The locked visual description reused in every image prompt, so the same
// hero looks the same across the whole adventure.
export function heroVisualDescription(
  characterName: string,
  characterClass: CharacterClass,
  gender: Gender,
  playerColorHsl: string
): string {
  const color = colorNameFromHsl(playerColorHsl)
  return `${characterName}, a brave young ${GENDER_WORD[gender]} ${CLASS_LOOK[characterClass]}, wearing a ${color} cape`
}
