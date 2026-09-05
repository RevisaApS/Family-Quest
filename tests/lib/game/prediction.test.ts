import { describe, it, expect } from 'vitest'
import { guessForRoll, isGuessRight, nextGuessStreak, HIGH_FROM } from '@/lib/game/prediction'

describe('roll guess (the off-turn twin\'s bet)', () => {
  it('splits the d20 into low 1–10 and high 11–20 with no ties', () => {
    expect(HIGH_FROM).toBe(11)
    for (let r = 1; r <= 10; r++) expect(guessForRoll(r)).toBe('low')
    for (let r = 11; r <= 20; r++) expect(guessForRoll(r)).toBe('high')
  })

  it('judges a guess against the roll', () => {
    expect(isGuessRight('high', 20)).toBe(true)
    expect(isGuessRight('high', 10)).toBe(false)
    expect(isGuessRight('low', 1)).toBe(true)
    expect(isGuessRight('low', 11)).toBe(false)
  })

  it('streak grows on a right guess, resets on a wrong one, holds when nobody guessed', () => {
    expect(nextGuessStreak(0, 'high', 15)).toBe(1)
    expect(nextGuessStreak(3, 'high', 15)).toBe(4)
    expect(nextGuessStreak(3, 'low', 15)).toBe(0)
    expect(nextGuessStreak(3, undefined, 15)).toBe(3)
  })
})
