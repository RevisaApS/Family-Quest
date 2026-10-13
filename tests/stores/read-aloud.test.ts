import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/game-store'

// The persisted shape at version 7, before the read-aloud setting existed
const v7State = {
  players: [{ id: 'p1', name: 'Mason', age: 8, color: 'blue' }],
  selectedPlayerIds: ['p1'],
  characters: [{ playerId: 'p1', name: 'Storm', class: 'wizard', gender: 'male' }],
  adventureStyle: 'realistic',
  difficulty: 'medium',
  dicePreference: 'physical',
  language: 'da',
  soundEnabled: false,
  storyHistory: ['[Storm · Jeg kaster en ildkugle · ✓] Ilden lyste op i hulen.'],
  quest: { title: 'Den Sorte Sø', goal: 'Find lygten', villain: 'Nattefyrsten', milestonesDone: 1, theme: 'patience', dilemmaAct: null },
  themeRotation: 2,
  themeOverride: null,
  chronicle: [],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrate = (persisted: unknown, version: number): any =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useGameStore.persist.getOptions().migrate as any)(persisted, version)

describe('read-aloud setting', () => {
  beforeEach(() => {
    useGameStore.setState({ readAloud: 'self' })
  })

  it('is on version 8', () => {
    expect(useGameStore.persist.getOptions().version).toBe(8)
  })

  it('defaults to the family reading themselves, so nothing changes until they opt in', () => {
    const migrated = migrate(structuredClone(v7State), 7)
    expect(migrated.readAloud).toBe('self')
  })

  it('keeps everything else a v7 family had', () => {
    const migrated = migrate(structuredClone(v7State), 7)
    const { readAloud, ...rest } = migrated
    expect(readAloud).toBe('self')
    expect(rest).toEqual(v7State)
  })

  it('migrates a very old save all the way through', () => {
    const migrated = migrate({ players: [], language: 'da' }, 0)
    expect(migrated.readAloud).toBe('self')
  })

  it('keeps a chosen narrator when the migration is replayed', () => {
    expect(migrate({ ...structuredClone(v7State), readAloud: 'narrator' }, 7).readAloud).toBe('narrator')
  })

  it('switches through setSettings and is persisted', () => {
    useGameStore.getState().setSettings({ readAloud: 'narrator' })
    expect(useGameStore.getState().readAloud).toBe('narrator')
    const persisted = useGameStore.persist.getOptions().partialize!(useGameStore.getState()) as { readAloud?: string }
    expect(persisted.readAloud).toBe('narrator')
  })
})
