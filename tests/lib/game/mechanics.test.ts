import { describe, it, expect } from 'vitest'
import { calculateSceneFitBonus, calculateOutcome } from '@/lib/game/mechanics'

describe('calculateSceneFitBonus', () => {
  it('should return 2 for good fit', () => { expect(calculateSceneFitBonus('good')).toBe(2) })
  it('should return 1 for okay fit', () => { expect(calculateSceneFitBonus('okay')).toBe(1) })
  it('should return 0 for risky fit', () => { expect(calculateSceneFitBonus('risky')).toBe(0) })
})

describe('calculateOutcome', () => {
  it('should return success when combined score meets threshold (medium)', () => {
    const result = calculateOutcome({ sceneFit: 'good', statValue: 5, diceRoll: 3, difficulty: 'medium' })
    expect(result.outcome).toBe('success')
    expect(result.combinedScore).toBe(10)
  })
  it('should return partial when score is in partial range (medium)', () => {
    const result = calculateOutcome({ sceneFit: 'good', statValue: 2, diceRoll: 3, difficulty: 'medium' })
    expect(result.outcome).toBe('partial')
  })
  it('should return failure when score is below partial range (medium)', () => {
    const result = calculateOutcome({ sceneFit: 'risky', statValue: 2, diceRoll: 2, difficulty: 'medium' })
    expect(result.outcome).toBe('failure')
  })
  it('should use easier thresholds for easy difficulty', () => {
    const result = calculateOutcome({ sceneFit: 'risky', statValue: 3, diceRoll: 3, difficulty: 'easy' })
    expect(result.outcome).toBe('partial')
  })
  it('should use harder thresholds for hard difficulty', () => {
    const result = calculateOutcome({ sceneFit: 'good', statValue: 5, diceRoll: 2, difficulty: 'hard' })
    expect(result.outcome).toBe('partial')
  })
})
