import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterClass, AdventureStyle, Difficulty, TurnRecord } from '@/types/game'

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

interface GameStore {
  players: Player[]
  addPlayer: (player: Omit<Player, 'id'>) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void

  selectedPlayerIds: string[]
  selectPlayer: (id: string) => void
  deselectPlayer: (id: string) => void

  adventureStyle: AdventureStyle
  difficulty: Difficulty
  dicePreference: 'physical' | 'digital'
  setSettings: (settings: Partial<{
    adventureStyle: AdventureStyle
    difficulty: Difficulty
    dicePreference: 'physical' | 'digital'
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
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
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

      selectedPlayerIds: [],
      selectPlayer: (id) => set((state) => ({
        selectedPlayerIds: [...state.selectedPlayerIds, id]
      })),
      deselectPlayer: (id) => set((state) => ({
        selectedPlayerIds: state.selectedPlayerIds.filter(pid => pid !== id)
      })),

      adventureStyle: 'realistic',
      difficulty: 'medium',
      dicePreference: 'digital',
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
    }),
    { name: 'family-quest-storage' }
  )
)
