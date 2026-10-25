import { describe, it, expect } from 'vitest'
import { sceneCast, sceneCreature } from '@/lib/game/scene-cast'

const LOOK = 'A hulking moss-green troll with one cracked tusk.'

describe('sceneCast', () => {
  it('keeps every portrait on its own hero when one hero has none', () => {
    const cast = sceneCast([
      { name: 'Lukas', description: 'Lukas, a brave boy warrior', portrait: 'data:image/jpeg;base64,L' },
      { name: 'Mads', description: 'Mads, a brave boy wizard', portrait: null },
      { name: 'Far', description: 'Far, a brave man ranger', portrait: 'data:image/jpeg;base64,F' },
    ], null)
    expect(cast.heroDescriptions).toEqual(['Lukas, a brave boy warrior', 'Mads, a brave boy wizard', 'Far, a brave man ranger'])
    expect(cast.references).toEqual([
      { label: 'Lukas', dataUrl: 'data:image/jpeg;base64,L' },
      { label: 'Far', dataUrl: 'data:image/jpeg;base64,F' },
    ])
    expect(cast.creature).toBeNull()
  })

  it('adds the creature last, labelled with its name', () => {
    const cast = sceneCast(
      [{ name: 'Lukas', description: 'Lukas', portrait: 'data:image/jpeg;base64,L' }],
      { id: 'e1', name: 'Mosetrolden', appearance: LOOK, portrait: 'data:image/jpeg;base64,M' }
    )
    expect(cast.references.map(r => r.label)).toEqual(['Lukas', 'Mosetrolden'])
    expect(cast.creature).toEqual({ name: 'Mosetrolden', appearance: LOOK })
  })

  it('keeps the look line when the monster portrait failed', () => {
    const cast = sceneCast([], { name: 'Mosetrolden', appearance: LOOK, portrait: null })
    expect(cast.references).toEqual([])
    expect(cast.creature).toEqual({ name: 'Mosetrolden', appearance: LOOK })
  })
})

describe('sceneCreature', () => {
  const troll = { id: 'e1', name: 'Mosetrolden', appearance: LOOK, defeated: false }

  it('takes the arriving creature from the scene, with the same fallback name as the encounter', () => {
    expect(sceneCreature('arriving-monster', { encounterName: ' Mosetrolden ', encounterAppearance: LOOK }, null, 'Skyggeuhyret'))
      .toEqual({ name: 'Mosetrolden', appearance: LOOK })
    expect(sceneCreature('arriving-boss', { encounterName: '', encounterAppearance: LOOK }, null, 'Fru Tang'))
      .toEqual({ name: 'Fru Tang', appearance: LOOK })
    expect(sceneCreature('arriving-monster', {}, null, 'Skyggeuhyret')).toBeNull()
  })

  it('takes the fighting creature from the stored encounter', () => {
    expect(sceneCreature('active', {}, troll, 'x')).toEqual({ id: 'e1', name: 'Mosetrolden', appearance: LOOK })
  })

  it('has no creature outside a fight, after it, or for an old encounter without a look', () => {
    expect(sceneCreature('none', {}, null, 'x')).toBeNull()
    expect(sceneCreature('just-defeated', {}, { ...troll, defeated: true }, 'x')).toBeNull()
    expect(sceneCreature('active', {}, { ...troll, appearance: undefined }, 'x')).toBeNull()
  })
})
