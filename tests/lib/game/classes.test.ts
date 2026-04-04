import { describe, it, expect } from 'vitest'
import { CLASS_DEFINITIONS, getClassStats, getStatBonus } from '@/lib/game/classes'

describe('CLASS_DEFINITIONS', () => {
  it('should have 4 classes', () => {
    expect(Object.keys(CLASS_DEFINITIONS)).toHaveLength(4)
  })
  it('should have all required classes', () => {
    expect(CLASS_DEFINITIONS.warrior).toBeDefined()
    expect(CLASS_DEFINITIONS.wizard).toBeDefined()
    expect(CLASS_DEFINITIONS.rogue).toBeDefined()
    expect(CLASS_DEFINITIONS.ranger).toBeDefined()
  })
  it('should have 12 total stat points per class', () => {
    Object.values(CLASS_DEFINITIONS).forEach(classDef => {
      const total = Object.values(classDef.stats).reduce((a, b) => a + b, 0)
      expect(total).toBe(12)
    })
  })
})

describe('getClassStats', () => {
  it('should return correct stats for warrior', () => {
    const stats = getClassStats('warrior')
    expect(stats.strength).toBe(5)
    expect(stats.magic).toBe(1)
    expect(stats.agility).toBe(2)
    expect(stats.heart).toBe(4)
  })
})

describe('getStatBonus', () => {
  it('should return stat value as bonus', () => {
    expect(getStatBonus(5)).toBe(5)
    expect(getStatBonus(1)).toBe(1)
  })
})
