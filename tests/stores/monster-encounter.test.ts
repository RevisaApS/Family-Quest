import { describe, it, expect } from 'vitest'
import { useGameStore } from '@/stores/game-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrate = (persisted: unknown, version: number): any =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useGameStore.persist.getOptions().migrate as any)(persisted, version)

const oldTroll = { kind: 'monster', name: 'Mosetrolden', hp: 3, maxHp: 6, defeated: false }

// The persisted shape at version 8: encounters with no id and no look
const v8State = {
  readAloud: 'self',
  encounter: oldTroll,
  savedAdventures: [
    { id: 's1', name: 'Slot 1', savedAt: 1, snapshot: { storyHistory: [], encounter: { ...oldTroll, name: 'Skyggekongen', kind: 'boss' } } },
    { id: 's2', name: 'Slot 2', savedAt: 2, snapshot: { storyHistory: [], encounter: null } },
  ],
}

describe('encounter ids (v9)', () => {
  it('is on version 9', () => {
    expect(useGameStore.persist.getOptions().version).toBe(9)
  })

  it('gives the live fight and every saved fight an id, and no look', () => {
    const migrated = migrate(structuredClone(v8State), 8)
    expect(migrated.encounter.id).toBeTruthy()
    expect(migrated.encounter).toMatchObject(oldTroll)
    expect(migrated.encounter.appearance).toBeUndefined()
    const saved = migrated.savedAdventures[0].snapshot.encounter
    expect(saved.id).toBeTruthy()
    expect(saved.id).not.toBe(migrated.encounter.id)
    expect(migrated.savedAdventures[1].snapshot.encounter).toBeNull()
  })

  it('leaves an adventure without a fight alone', () => {
    const migrated = migrate({ ...structuredClone(v8State), encounter: null, savedAdventures: undefined }, 8)
    expect(migrated.encounter).toBeNull()
    expect(migrated.savedAdventures).toBeUndefined()
  })
})
