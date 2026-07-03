import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterClass, AdventureStyle, Difficulty, TurnRecord } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface Player {
  id: string
  name: string
  age: number
  color: string
}

interface Character {
  playerId: string
  name: string
  class: CharacterClass
  gender: 'male' | 'female' | 'neutral'
}

export interface SavedAdventure {
  id: string
  name: string
  savedAt: number
  snapshot: {
    selectedPlayerIds: string[]
    characters: Character[]
    currentScene: string
    storyHistory: string[]
    turnHistory: TurnRecord[]
    currentPlayerIndex: number
    adventureStyle: AdventureStyle
    difficulty: Difficulty
  }
}

interface GameStore {
  _hasHydrated: boolean

  players: Player[]
  addPlayer: (player: Omit<Player, 'id'>) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  reorderPlayers: (fromIndex: number, toIndex: number) => void

  selectedPlayerIds: string[]
  selectPlayer: (id: string) => void
  deselectPlayer: (id: string) => void

  adventureStyle: AdventureStyle
  difficulty: Difficulty
  dicePreference: 'physical' | 'digital'
  language: Language
  setSettings: (settings: Partial<{
    adventureStyle: AdventureStyle
    difficulty: Difficulty
    dicePreference: 'physical' | 'digital'
    language: Language
  }>) => void

  characters: Character[]
  setCharacter: (character: Character) => void
  clearCharacters: () => void

  currentScene: string
  storyHistory: string[]
  turnHistory: TurnRecord[]
  currentPlayerIndex: number
  updateAdventureState: (state: Partial<{
    currentScene: string
    storyHistory: string[]
    turnHistory: TurnRecord[]
    currentPlayerIndex: number
  }>) => void
  resetAdventure: () => void

  savedAdventures: SavedAdventure[]
  activeAdventureId: string | null
  saveAdventure: (name?: string) => void
  loadAdventure: (id: string) => void
  deleteAdventure: (id: string) => void
  startNewAdventure: () => void
}

const takeSnapshot = (state: GameStore): SavedAdventure['snapshot'] => ({
  selectedPlayerIds: state.selectedPlayerIds,
  characters: state.characters,
  currentScene: state.currentScene,
  storyHistory: state.storyHistory,
  turnHistory: state.turnHistory,
  currentPlayerIndex: state.currentPlayerIndex,
  adventureStyle: state.adventureStyle,
  difficulty: state.difficulty,
})

// Snapshot the in-progress story into its slot (or a new auto-named one) so
// switching adventures can never lose a story. No-op when nothing is in progress.
const upsertCurrent = (
  state: GameStore,
  name?: string
): Pick<GameStore, 'savedAdventures' | 'activeAdventureId'> => {
  if (state.storyHistory.length === 0) {
    return { savedAdventures: state.savedAdventures, activeAdventureId: state.activeAdventureId }
  }
  const snapshot = takeSnapshot(state)
  if (state.activeAdventureId) {
    return {
      savedAdventures: state.savedAdventures.map(a =>
        a.id === state.activeAdventureId
          ? { ...a, name: name?.trim() || a.name, savedAt: Date.now(), snapshot }
          : a
      ),
      activeAdventureId: state.activeAdventureId,
    }
  }
  const id = crypto.randomUUID()
  return {
    savedAdventures: [...state.savedAdventures, {
      id,
      name: name?.trim() || `Adventure ${state.savedAdventures.length + 1}`,
      savedAt: Date.now(),
      snapshot,
    }],
    activeAdventureId: id,
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,

      players: [],
      addPlayer: (player) => set((state) => ({
        players: [...state.players, { ...player, id: crypto.randomUUID() }]
      })),
      removePlayer: (id) => set((state) => ({
        players: state.players.filter(p => p.id !== id),
        selectedPlayerIds: state.selectedPlayerIds.filter(pid => pid !== id)
      })),
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      reorderPlayers: (fromIndex, toIndex) => set((state) => {
        const updated = [...state.players]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved)
        return { players: updated }
      }),

      selectedPlayerIds: [],
      selectPlayer: (id) => set((state) => ({
        selectedPlayerIds: [...state.selectedPlayerIds, id]
      })),
      deselectPlayer: (id) => set((state) => ({
        selectedPlayerIds: state.selectedPlayerIds.filter(pid => pid !== id)
      })),

      adventureStyle: 'realistic',
      difficulty: 'medium',
      dicePreference: 'physical',
      language: 'da',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),

      characters: [],
      setCharacter: (character) => set((state) => ({
        characters: [
          ...state.characters.filter(c => c.playerId !== character.playerId),
          character
        ]
      })),
      clearCharacters: () => set({ characters: [] }),

      currentScene: '',
      storyHistory: [],
      turnHistory: [],
      currentPlayerIndex: 0,
      updateAdventureState: (updates) => set((prev) => ({ ...prev, ...updates })),
      resetAdventure: () => set({
        currentScene: '',
        storyHistory: [],
        turnHistory: [],
        currentPlayerIndex: 0,
      }),

      savedAdventures: [],
      activeAdventureId: null,
      saveAdventure: (name) => set((state) => upsertCurrent(state, name)),
      loadAdventure: (id) => set((state) => {
        if (!state.savedAdventures.some(a => a.id === id)) return state
        const saved = upsertCurrent(state)
        const target = saved.savedAdventures.find(a => a.id === id)!
        return { ...saved, ...target.snapshot, activeAdventureId: id }
      }),
      deleteAdventure: (id) => set((state) => ({
        savedAdventures: state.savedAdventures.filter(a => a.id !== id),
        activeAdventureId: state.activeAdventureId === id ? null : state.activeAdventureId,
      })),
      startNewAdventure: () => set((state) => ({
        ...upsertCurrent(state),
        currentScene: '',
        storyHistory: [],
        turnHistory: [],
        currentPlayerIndex: 0,
        activeAdventureId: null,
      })),
    }),
    {
      name: 'family-quest-storage',
      version: 1,
      // v0 storage predates the language setting and had digital dice as the
      // unchosen default — align both with the new defaults once.
      migrate: (persisted, version) => {
        const state = persisted as GameStore
        if (version < 1) {
          return { ...state, language: 'da' as Language, dicePreference: 'physical' as const }
        }
        return state
      },
      partialize: (state) => {
        const { _hasHydrated, ...rest } = state
        return rest
      },
    }
  )
)

// Mark hydration complete once persist has finished loading from localStorage
// Guard against SSR where persist API may not be available
if (typeof window !== 'undefined') {
  const unsub = useGameStore.persist.onFinishHydration(() => {
    useGameStore.setState({ _hasHydrated: true })
    unsub()
  })

  // Handle case where hydration already completed synchronously
  if (useGameStore.persist.hasHydrated()) {
    useGameStore.setState({ _hasHydrated: true })
  }
}
