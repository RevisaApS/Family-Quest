import { describe, it, expect } from 'vitest'
import {
  colorNameFromHsl,
  gearLooksFromEquipment,
  heroVisualDescription,
} from '@/lib/game/appearance'
import type { LootItem } from '@/types/game'

const stick: LootItem = {
  id: 'shop-weapon-0', slot: 'weapon', stat: 'strength', bonus: 1,
  name: 'Crooked Stick', emoji: '⚔️', look: 'a crooked wooden stick held like a sword',
}
const helm: LootItem = {
  id: 'shop-helmet-3', slot: 'helmet', stat: 'heart', bonus: 4,
  name: 'The Golden Helm', emoji: '🪖', look: 'a magnificent shining golden helmet',
}

describe('colorNameFromHsl', () => {
  it('maps hues to paintable color words', () => {
    expect(colorNameFromHsl('hsl(210, 70%, 50%)')).toBe('blue')
    expect(colorNameFromHsl('hsl(10, 70%, 50%)')).toBe('red')
  })
  it('falls back to blue for unparseable input', () => {
    expect(colorNameFromHsl('not-a-color')).toBe('blue')
  })
})

describe('gearLooksFromEquipment', () => {
  it('collects the look of every equipped item', () => {
    expect(gearLooksFromEquipment({ weapon: stick, helmet: helm })).toEqual({
      weapon: 'a crooked wooden stick held like a sword',
      helmet: 'a magnificent shining golden helmet',
    })
  })

  it('gives a filled slot a generic look rather than dropping it', () => {
    // A slot with an item but no look must never be described as empty —
    // the hero owns something there.
    const looks = gearLooksFromEquipment({ weapon: { ...stick, look: undefined } })
    expect(looks.weapon).toBeTruthy()
  })

  it('is empty for a hero who owns nothing', () => {
    expect(gearLooksFromEquipment({})).toEqual({})
  })
})

describe('heroVisualDescription', () => {
  const hero = (gear = {}, pet?: string) =>
    heroVisualDescription('Lukas', 'warrior', 'male', 'hsl(210, 70%, 50%)', 8, gear, pet)

  it('starts every hero empty-handed — no class gear in the prompt', () => {
    const description = hero()
    expect(description).toContain('Lukas')
    expect(description).toContain('young boy')
    expect(description).toContain('blue cape')
    expect(description).toContain('carrying nothing at all')
    // The warrior used to arrive pre-armed, which made the first purchase
    // invisible in the pictures.
    expect(description).not.toMatch(/holding a sword|round shield|glowing staff|wooden bow|quiver/i)
    expect(description).toContain('empty hands and no weapon')
    expect(description).toContain('bare feet, no boots')
  })

  it('spells out equipped gear so it shows up in the picture', () => {
    const description = hero(gearLooksFromEquipment({ weapon: stick }))
    expect(description).toContain('equipped with a crooked wooden stick held like a sword')
    expect(description).not.toContain('carrying nothing at all')
  })

  it('still names the empty slots when only some gear is owned', () => {
    const description = hero(gearLooksFromEquipment({ weapon: stick }))
    expect(description).toContain('and nothing else')
    expect(description).toContain('a bare head, no helmet')
    expect(description).not.toContain('empty hands and no weapon')
  })

  it('lists every worn item once the hero is fully kitted out', () => {
    const description = hero(gearLooksFromEquipment({ weapon: stick, helmet: helm }))
    expect(description).toContain('a crooked wooden stick held like a sword')
    expect(description).toContain('a magnificent shining golden helmet')
  })

  it('walks the pet alongside the hero', () => {
    expect(hero({}, 'a small loyal grey wolf pup')).toContain(
      'accompanied by a small loyal grey wolf pup'
    )
  })

  it('ages the hero from the real player age', () => {
    expect(heroVisualDescription('Mor', 'wizard', 'female', 'hsl(300, 70%, 50%)', 40))
      .toContain('adult woman')
    expect(heroVisualDescription('Ida', 'rogue', 'female', 'hsl(300, 70%, 50%)', 15))
      .toContain('teenage girl')
  })
})
