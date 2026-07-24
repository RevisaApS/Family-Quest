import { describe, it, expect } from 'vitest'
import { calculateDC, resolveD20, requiredRolls, rollD20, PARTIAL_BAND } from '@/lib/game/mechanics'

describe('calculateDC', () => {
  it('scales with difficulty', () => {
    expect(calculateDC({ difficulty: 'easy', sceneFit: 'okay', level: 1, encounterActive: false })).toBe(10)
    expect(calculateDC({ difficulty: 'medium', sceneFit: 'okay', level: 1, encounterActive: false })).toBe(12)
    expect(calculateDC({ difficulty: 'hard', sceneFit: 'okay', level: 1, encounterActive: false })).toBe(14)
  })

  it('smart choices lower the DC, risky ones raise it', () => {
    const base = { difficulty: 'medium' as const, level: 1, encounterActive: false }
    expect(calculateDC({ ...base, sceneFit: 'good' })).toBe(10)
    expect(calculateDC({ ...base, sceneFit: 'risky' })).toBe(14)
  })

  it('rises with level and during battles', () => {
    expect(calculateDC({ difficulty: 'medium', sceneFit: 'okay', level: 3, encounterActive: false })).toBe(13)
    expect(calculateDC({ difficulty: 'medium', sceneFit: 'okay', level: 1, encounterActive: true })).toBe(13)
  })

  // Heroes gain roughly +1 to the stat they use per level-up, so a DC that also
  // climbed +1 per level cancelled it out and levelling felt like a treadmill.
  it('climbs at half the rate heroes gain stats, so levelling feels strong', () => {
    const base = { difficulty: 'medium' as const, sceneFit: 'okay' as const, encounterActive: false }
    const atLevel1 = calculateDC({ ...base, level: 1 })
    const atMaxLevel = calculateDC({ ...base, level: 5 })
    expect(atMaxLevel - atLevel1).toBe(2)
  })
})

describe('resolveD20', () => {
  it('meets the DC → success, within the band → partial, below → failure', () => {
    expect(resolveD20(8, 4, 12).outcome).toBe('success')   // 12 vs 12
    expect(resolveD20(5, 4, 12).outcome).toBe('partial')   // 9 vs 12 (band 4)
    expect(resolveD20(3, 4, 12).outcome).toBe('failure')   // 7 vs 12
  })

  it('natural 20 always crits, even against impossible odds', () => {
    const result = resolveD20(20, 0, 30)
    expect(result.outcome).toBe('success')
    expect(result.crit).toBe('crit')
  })

  it('natural 1 always fumbles, even with huge bonuses', () => {
    const result = resolveD20(1, 15, 10)
    expect(result.outcome).toBe('failure')
    expect(result.crit).toBe('fumble')
  })

  it('non-extreme rolls never crit or fumble', () => {
    expect(resolveD20(19, 0, 5).crit).toBeNull()
    expect(resolveD20(2, 0, 30).crit).toBeNull()
  })
})

describe('requiredRolls — what the kid sees before rolling', () => {
  it('high stats in an easy spot need a low roll', () => {
    // DC 10, stat +7 → roll 3+
    expect(requiredRolls(10, 7)).toEqual({ success: 3, partial: 2 })
  })

  it('low stats in a tough spot need a high roll', () => {
    // DC 15, stat +1 → roll 14+
    expect(requiredRolls(15, 1)).toEqual({ success: 14, partial: 10 })
  })

  it('clamps to 2..20 (natural 1 always fails, 20 always crits)', () => {
    expect(requiredRolls(5, 10).success).toBe(2)
    expect(requiredRolls(30, 0).success).toBe(20)
  })

  it('partial sits PARTIAL_BAND below success', () => {
    const { success, partial } = requiredRolls(15, 3)
    expect(success - partial).toBe(PARTIAL_BAND)
  })
})

describe('rollD20', () => {
  it('stays within 1..20', () => {
    for (let i = 0; i < 200; i++) {
      const roll = rollD20()
      expect(roll).toBeGreaterThanOrEqual(1)
      expect(roll).toBeLessThanOrEqual(20)
    }
  })
})
