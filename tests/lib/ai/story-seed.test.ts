import { describe, it, expect } from 'vitest'
import { pickStorySeed, seedInstruction } from '@/lib/ai/story-seed'

describe('pickStorySeed', () => {
  it('fills every ingredient', () => {
    const seed = pickStorySeed(() => 0)
    for (const value of Object.values(seed)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('picks the first option at 0 and the last at just under 1', () => {
    const first = pickStorySeed(() => 0)
    const last = pickStorySeed(() => 0.999999)
    expect(first.opening).not.toBe(last.opening)
    expect(first.villainNaming).not.toBe(last.villainNaming)
  })

  it('stays in range even if the generator returns exactly 1', () => {
    const seed = pickStorySeed(() => 1)
    for (const value of Object.values(seed)) expect(value).toBeTruthy()
  })

  it('produces different openings across draws', () => {
    // The whole point: two adventures must not start from the same
    // ingredients. 40 real draws should hit far more than a couple of
    // distinct combinations.
    const combos = new Set(
      Array.from({ length: 40 }, () => JSON.stringify(pickStorySeed()))
    )
    expect(combos.size).toBeGreaterThan(30)
  })
})

describe('seedInstruction', () => {
  const seed = pickStorySeed(() => 0)

  it('hands the model every ingredient it drew', () => {
    const text = seedInstruction(seed)
    expect(text).toContain(seed.opening)
    expect(text).toContain(seed.stake)
    expect(text).toContain(seed.villain)
    expect(text).toContain(seed.questGiver)
    expect(text).toContain(seed.hook)
    expect(text).toContain(seed.villainNaming)
  })

  it('bans the names the model keeps reaching for', () => {
    // The family reported meeting Malachor over and over.
    expect(seedInstruction(seed)).toContain('Malachor')
    expect(seedInstruction(seed)).toMatch(/Never use any of these worn-out names/)
  })

  it('also bans villains this family has already beaten', () => {
    const text = seedInstruction(seed, ['Fru Tang', 'The Quiet Aunt'])
    expect(text).toContain('Fru Tang')
    expect(text).toContain('The Quiet Aunt')
  })

  it('steers away from the generic default story', () => {
    expect(seedInstruction(seed)).toMatch(/do not drift back to a generic fantasy/i)
  })
})
