import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/game-store'

function seedStory() {
  useGameStore.setState({
    selectedPlayerIds: ['p1'],
    characters: [{ playerId: 'p1', name: 'Luna', class: 'wizard', gender: 'female' }],
    currentScene: 'A cave',
    storyHistory: ['Scene 1: A cave'],
    turnHistory: [],
    currentPlayerIndex: 0,
  })
}

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState({
    savedAdventures: [],
    activeAdventureId: null,
    selectedPlayerIds: [],
    characters: [],
    currentScene: '',
    storyHistory: [],
    turnHistory: [],
    currentPlayerIndex: 0,
  })
})

describe('adventure save slots', () => {
  it('saveAdventure creates a named slot and marks it active', () => {
    seedStory()
    useGameStore.getState().saveAdventure('Lunas eventyr')
    const { savedAdventures, activeAdventureId } = useGameStore.getState()
    expect(savedAdventures).toHaveLength(1)
    expect(savedAdventures[0].name).toBe('Lunas eventyr')
    expect(activeAdventureId).toBe(savedAdventures[0].id)
    expect(savedAdventures[0].snapshot.storyHistory).toEqual(['Scene 1: A cave'])
  })

  it('saveAdventure with no story does nothing', () => {
    useGameStore.getState().saveAdventure('Empty')
    expect(useGameStore.getState().savedAdventures).toHaveLength(0)
  })

  it('startNewAdventure auto-saves the active story and resets state', () => {
    seedStory()
    useGameStore.getState().saveAdventure('Lunas eventyr')
    useGameStore.setState({ storyHistory: ['Scene 1: A cave', 'Scene 2: A troll'] })
    useGameStore.getState().startNewAdventure()

    const state = useGameStore.getState()
    expect(state.storyHistory).toEqual([])
    expect(state.currentScene).toBe('')
    expect(state.activeAdventureId).toBeNull()
    expect(state.savedAdventures[0].snapshot.storyHistory).toHaveLength(2)
  })

  it('startNewAdventure auto-names an unsaved story so it is never lost', () => {
    seedStory()
    useGameStore.getState().startNewAdventure()
    const { savedAdventures, storyHistory } = useGameStore.getState()
    expect(savedAdventures).toHaveLength(1)
    expect(savedAdventures[0].name).toBeTruthy()
    expect(storyHistory).toEqual([])
  })

  it('loadAdventure restores a snapshot and auto-saves the story being left', () => {
    seedStory()
    useGameStore.getState().saveAdventure('Lunas eventyr')
    const lunaId = useGameStore.getState().activeAdventureId!

    useGameStore.getState().startNewAdventure()
    useGameStore.setState({
      storyHistory: ['Scene 1: A forest'],
      currentScene: 'A forest',
    })
    useGameStore.getState().saveAdventure('Milos eventyr')

    useGameStore.getState().loadAdventure(lunaId)
    const state = useGameStore.getState()
    expect(state.storyHistory).toEqual(['Scene 1: A cave'])
    expect(state.activeAdventureId).toBe(lunaId)
    expect(state.savedAdventures).toHaveLength(2)
    const milo = state.savedAdventures.find(a => a.name === 'Milos eventyr')!
    expect(milo.snapshot.storyHistory).toEqual(['Scene 1: A forest'])
  })

  it('loading the already-active slot keeps the live story, not a stale snapshot', () => {
    seedStory()
    useGameStore.getState().saveAdventure('Lunas eventyr')
    const id = useGameStore.getState().activeAdventureId!
    useGameStore.setState({ storyHistory: ['Scene 1: A cave', 'Scene 2: Deeper'] })

    useGameStore.getState().loadAdventure(id)
    expect(useGameStore.getState().storyHistory).toHaveLength(2)
  })

  it('deleteAdventure removes the slot and clears active id if needed', () => {
    seedStory()
    useGameStore.getState().saveAdventure('Lunas eventyr')
    const id = useGameStore.getState().activeAdventureId!
    useGameStore.getState().deleteAdventure(id)
    const state = useGameStore.getState()
    expect(state.savedAdventures).toHaveLength(0)
    expect(state.activeAdventureId).toBeNull()
  })
})
