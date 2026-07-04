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

// The locked visual description reused in every image prompt, so the same
// hero looks the same across the whole adventure.
export function heroVisualDescription(
  characterName: string,
  characterClass: CharacterClass,
  gender: Gender,
  playerColorHsl: string,
  age: number
): string {
  const color = colorNameFromHsl(playerColorHsl)
  const article = /^[aeiou]/.test(color) ? 'an' : 'a'
  return `${characterName}, a brave ${personWord(gender, age)} ${CLASS_LOOK[characterClass]}, wearing ${article} ${color} cape`
}
