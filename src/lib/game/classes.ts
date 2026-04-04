import type { CharacterClass, ClassDefinition, Stat } from '@/types/game'

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  warrior: {
    name: 'warrior', displayName: 'Warrior', emoji: '⚔️',
    description: 'A brave fighter who protects their friends',
    goodAt: 'Fighting, protecting friends',
    notGreatAt: 'Sneaking, casting spells',
    stats: { strength: 5, magic: 1, agility: 2, heart: 4 },
  },
  wizard: {
    name: 'wizard', displayName: 'Wizard', emoji: '🧙',
    description: 'A clever spellcaster who solves puzzles with magic',
    goodAt: 'Casting spells, solving puzzles',
    notGreatAt: 'Heavy lifting, direct combat',
    stats: { strength: 1, magic: 5, agility: 4, heart: 2 },
  },
  rogue: {
    name: 'rogue', displayName: 'Rogue', emoji: '🗡️',
    description: 'A sneaky treasure hunter who moves like a shadow',
    goodAt: 'Sneaking, finding treasure',
    notGreatAt: 'Talking their way out, brute force',
    stats: { strength: 2, magic: 3, agility: 5, heart: 2 },
  },
  ranger: {
    name: 'ranger', displayName: 'Ranger', emoji: '🏹',
    description: 'A nature expert who tracks and helps others',
    goodAt: 'Tracking, archery, nature',
    notGreatAt: 'Magic spells, heavy combat',
    stats: { strength: 2, magic: 2, agility: 4, heart: 4 },
  },
}

export function getClassStats(characterClass: CharacterClass): Record<Stat, number> {
  return CLASS_DEFINITIONS[characterClass].stats
}

export function getStatBonus(statValue: number): number {
  return statValue
}
