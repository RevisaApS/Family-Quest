import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/game-store'
import { VALUE_THEMES, nextTheme } from '@/lib/game/values'

// The persisted shape as it stood at version 6 (before the values layer), with
// a story in progress — a real upgrade for a family mid-adventure.
const v6State = {
  players: [{ id: 'p1', name: 'Lucas', age: 9, color: 'red' }],
  selectedPlayerIds: ['p1'],
  characters: [{ playerId: 'p1', name: 'Luna', class: 'wizard', gender: 'female' }],
  adventureStyle: 'realistic',
  difficulty: 'medium',
  dicePreference: 'physical',
  language: 'da',
  currentScene: 'A cave mouth',
  storyHistory: ['[Luna · Jeg lister ind · ✓] Hun listede ind i mørket.'],
  turnHistory: [{ playerId: 'p1', actionChosen: 'Jeg lister ind', stat: 'agility', sceneFit: 'good', diceRoll: 14, outcome: 'success', narrativeResult: '...' }],
  currentPlayerIndex: 0,
  heroes: [{ playerId: 'p1', level: 2, hp: 7, maxHp: 10, gold: 12, usedPowers: [], potions: [], comeback: 1, assistUsed: false, skills: [], equipment: {}, knockedOut: false, xp: 5 }],
  encounter: null,
  quest: { title: 'Den Sorte Sø', goal: 'Find den stjålne lygte', villain: 'Nattefyrsten', milestonesDone: 1 },
  diceInventory: { d4: 0, d6: 2, d8: 0, d10: 0, d12: 0, d20: 1 },
  soundEnabled: true,
  shopHintSeen: true,
  savedAdventures: [{ id: 'a1', name: 'Lunas eventyr', savedAt: 1, snapshot: { storyHistory: ['x'] } }],
  activeAdventureId: 'a1',
  chronicle: [{ id: 'c1', questTitle: 'Det Første Eventyr', villain: 'Skyggekongen' }],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrate = (persisted: unknown, version: number): any =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useGameStore.persist.getOptions().migrate as any)(persisted, version)

describe('store migration v6 → v7', () => {
  it('is on version 7', () => {
    expect(useGameStore.persist.getOptions().version).toBe(7)
  })

  it('initialises the values fields', () => {
    const migrated = migrate(structuredClone(v6State), 6)
    expect(migrated.themeRotation).toBe(0)
    expect(migrated.themeOverride).toBeNull()
  })

  it('preserves every pre-existing piece of state', () => {
    const migrated = migrate(structuredClone(v6State), 6)
    expect(migrated.players).toEqual(v6State.players)
    expect(migrated.characters).toEqual(v6State.characters)
    expect(migrated.heroes).toEqual(v6State.heroes)
    expect(migrated.storyHistory).toEqual(v6State.storyHistory)
    expect(migrated.turnHistory).toEqual(v6State.turnHistory)
    expect(migrated.savedAdventures).toEqual(v6State.savedAdventures)
    expect(migrated.activeAdventureId).toBe('a1')
    expect(migrated.chronicle).toEqual(v6State.chronicle)
    expect(migrated.diceInventory).toEqual(v6State.diceInventory)
    expect(migrated.language).toBe('da')
    expect(migrated.shopHintSeen).toBe(true)
    expect(migrated.quest).toMatchObject({
      title: 'Den Sorte Sø',
      goal: 'Find den stjålne lygte',
      villain: 'Nattefyrsten',
      milestonesDone: 1,
    })
  })

  it('leaves an in-flight quest without a theme — its villain was built without one', () => {
    const migrated = migrate(structuredClone(v6State), 6)
    expect(migrated.quest.theme).toBeUndefined()
    expect(migrated.quest.dilemmaAct).toBeNull()
  })

  it('does not invent a quest for a family between adventures', () => {
    const migrated = migrate({ ...structuredClone(v6State), quest: null }, 6)
    expect(migrated.quest).toBeNull()
    expect(migrated.themeRotation).toBe(0)
  })

  it('keeps an already-set rotation pointer when replaying the migration', () => {
    const migrated = migrate({ ...structuredClone(v6State), themeRotation: 3, themeOverride: 'control' }, 6)
    expect(migrated.themeRotation).toBe(3)
    expect(migrated.themeOverride).toBe('control')
  })

  it('cascades from an ancient save all the way to the values fields', () => {
    const migrated = migrate({ players: [{ id: 'p1', name: 'Mason', age: 9, color: 'blue' }] }, 0)
    expect(migrated.players).toHaveLength(1)
    expect(migrated.language).toBe('da')
    expect(migrated.chronicle).toEqual([])
    expect(migrated.themeRotation).toBe(0)
    expect(migrated.themeOverride).toBeNull()
  })
})

describe('picking an adventure theme', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ themeRotation: 0, themeOverride: null, quest: null })
  })

  it('walks the rotation, one idea per adventure, all four before repeating', () => {
    const picked = [0, 1, 2, 3].map(() => useGameStore.getState().pickAdventureTheme().id)
    expect(new Set(picked).size).toBe(4)
    expect(useGameStore.getState().themeRotation).toBe(4)
    expect(useGameStore.getState().pickAdventureTheme().id).toBe(picked[0])
  })

  it('honours the override and does not burn a rotation step on it', () => {
    useGameStore.getState().setThemeOverride('others-anger')
    expect(useGameStore.getState().pickAdventureTheme().id).toBe('others-anger')
    expect(useGameStore.getState().pickAdventureTheme().id).toBe('others-anger')
    expect(useGameStore.getState().themeRotation).toBe(0)

    // Clearing it resumes the rotation exactly where it was left
    useGameStore.getState().setThemeOverride(null)
    expect(useGameStore.getState().pickAdventureTheme().id).toBe(VALUE_THEMES[0].id)
  })

  it('agrees with the pure selector, so the settings preview cannot drift', () => {
    useGameStore.setState({ themeRotation: 2 })
    const { themeRotation, themeOverride } = useGameStore.getState()
    expect(useGameStore.getState().pickAdventureTheme().id).toBe(nextTheme(themeRotation, themeOverride).id)
  })
})

describe('marking the act that spent its dilemma', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      quest: { title: 'Q', goal: 'G', milestonesDone: 0, theme: 'control', dilemmaAct: null },
    })
  })

  it('records the act on the quest so it survives a reload', () => {
    useGameStore.getState().markDilemmaPlanted(0)
    expect(useGameStore.getState().quest?.dilemmaAct).toBe(0)
    useGameStore.getState().markDilemmaPlanted(1)
    expect(useGameStore.getState().quest?.dilemmaAct).toBe(1)
  })

  it('is a no-op with no quest running', () => {
    useGameStore.setState({ quest: null })
    useGameStore.getState().markDilemmaPlanted(0)
    expect(useGameStore.getState().quest).toBeNull()
  })

  it('a new adventure drops the theme and the dilemma marker with the quest', () => {
    useGameStore.getState().markDilemmaPlanted(0)
    useGameStore.getState().resetAdventure()
    expect(useGameStore.getState().quest).toBeNull()
  })
})
