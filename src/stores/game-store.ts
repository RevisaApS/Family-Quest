import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CharacterClass, AdventureStyle, Difficulty, TurnRecord, HeroState,
  EncounterState, Quest, DiceInventory,
} from '@/types/game'
import { createHero } from '@/lib/game/rpg'
import { nextTheme, type ValueTheme, type ValueThemeId } from '@/lib/game/values'
import type { CompletedAdventure } from '@/lib/game/chronicle'
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
    heroes?: HeroState[]
    encounter?: EncounterState | null
    quest?: Quest | null
    // pre-v4 saves stored the boss here
    boss?: (EncounterState & { kind?: 'monster' | 'boss' }) | null
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
  heroes: HeroState[]
  encounter: EncounterState | null
  quest: Quest | null
  diceInventory: DiceInventory
  soundEnabled: boolean
  // One-time onboarding hint pointing out the shop button
  shopHintSeen: boolean
  setShopHintSeen: () => void
  setSoundEnabled: (enabled: boolean) => void
  setDiceInventory: (inventory: DiceInventory) => void
  initHeroes: (playerIds: string[]) => void
  updateHero: (hero: HeroState) => void
  setEncounter: (encounter: EncounterState | null) => void
  setQuest: (quest: Quest | null) => void

  // The values layer (src/lib/game/values.ts). The rotation pointer walks all
  // four ideas before repeating; the override is the grown-up's aim-it-at-this
  // slot and always wins. Neither is ever shown to the kids.
  themeRotation: number
  themeOverride: ValueThemeId | null
  setThemeOverride: (theme: ValueThemeId | null) => void
  // Picks this adventure's theme and advances the rotation (an override doesn't
  // consume a rotation step, so the cycle resumes where it left off).
  pickAdventureTheme: () => ValueTheme
  // One dilemma per act: remembers which act already spent its one
  markDilemmaPlanted: (act: number) => void

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

  // The family's permanent record of completed quests — the Hall of Heroes
  chronicle: CompletedAdventure[]
  addToChronicle: (record: CompletedAdventure) => void
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
  heroes: state.heroes,
  encounter: state.encounter,
  quest: state.quest,
})

const DEFAULT_DICE: DiceInventory = { d4: 0, d6: 2, d8: 0, d10: 0, d12: 0, d20: 0 }

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
    (set, get) => ({
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
      heroes: [],
      encounter: null,
      quest: null,
      diceInventory: DEFAULT_DICE,
      soundEnabled: true,
      shopHintSeen: false,
      setShopHintSeen: () => set({ shopHintSeen: true }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setDiceInventory: (inventory) => set({ diceInventory: inventory }),
      initHeroes: (playerIds) => set({ heroes: playerIds.map(createHero), encounter: null, quest: null }),
      updateHero: (hero) => set((state) => ({
        heroes: state.heroes.map(h => h.playerId === hero.playerId ? hero : h),
      })),
      setEncounter: (encounter) => set({ encounter }),
      setQuest: (quest) => set({ quest }),

      themeRotation: 0,
      themeOverride: null,
      setThemeOverride: (theme) => set({ themeOverride: theme }),
      pickAdventureTheme: () => {
        const { themeRotation, themeOverride } = get()
        const theme = nextTheme(themeRotation, themeOverride)
        if (!themeOverride) set({ themeRotation: themeRotation + 1 })
        return theme
      },
      markDilemmaPlanted: (act) => set((state) => (
        state.quest ? { quest: { ...state.quest, dilemmaAct: act } } : state
      )),

      updateAdventureState: (updates) => set((prev) => ({ ...prev, ...updates })),
      resetAdventure: () => set({
        currentScene: '',
        storyHistory: [],
        turnHistory: [],
        currentPlayerIndex: 0,
        heroes: [],
        encounter: null,
        quest: null,
      }),

      savedAdventures: [],
      activeAdventureId: null,
      saveAdventure: (name) => set((state) => upsertCurrent(state, name)),
      loadAdventure: (id) => set((state) => {
        if (!state.savedAdventures.some(a => a.id === id)) return state
        const saved = upsertCurrent(state)
        const target = saved.savedAdventures.find(a => a.id === id)!
        // Saves from older versions get normalized: gold/powers defaults,
        // pre-v4 boss field becomes an encounter.
        const oldBoss = target.snapshot.boss
        return {
          ...saved,
          ...target.snapshot,
          heroes: (target.snapshot.heroes ?? []).map(h => ({
            ...h,
            gold: h.gold ?? 1,
            usedPowers: h.usedPowers ?? [],
            potions: h.potions ?? [],
            comeback: h.comeback ?? 0,
            assistUsed: h.assistUsed ?? false,
          })),
          encounter: target.snapshot.encounter
            ?? (oldBoss ? { ...oldBoss, kind: oldBoss.kind ?? 'boss' as const } : null),
          quest: target.snapshot.quest ?? null,
          activeAdventureId: id,
        }
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
        heroes: [],
        encounter: null,
        quest: null,
        activeAdventureId: null,
      })),

      chronicle: [],
      addToChronicle: (record) => set((state) => (
        state.chronicle.some(r => r.id === record.id)
          ? state
          : { chronicle: [...state.chronicle, record] }
      )),
    }),
    {
      name: 'family-quest-storage',
      version: 7,
      // v0 storage predates the language setting and had digital dice as the
      // unchosen default — align both with the new defaults once.
      // v1 predates the RPG update (heroes, boss, sound).
      // v2 predates the gold economy.
      // v3 predates d20/quest arc (encounter replaces boss, powers, dice inventory).
      // v4 predates teamwork/potions/pets (assist, comeback, potion backpack).
      // v5 predates the Hall of Heroes chronicle.
      // v6 predates the values layer (theme rotation + override).
      migrate: (persisted, version) => {
        let state = persisted as GameStore & { boss?: EncounterState | null }
        if (version < 1) {
          state = { ...state, language: 'da' as Language, dicePreference: 'physical' as const }
        }
        if (version < 2) {
          state = { ...state, heroes: [], soundEnabled: true }
        }
        if (version < 3) {
          state = { ...state, heroes: (state.heroes ?? []).map(h => ({ ...h, gold: h.gold ?? 1 })) }
        }
        if (version < 4) {
          state = {
            ...state,
            heroes: (state.heroes ?? []).map(h => ({ ...h, usedPowers: h.usedPowers ?? [] })),
            encounter: state.boss ? { ...state.boss, kind: 'boss' as const } : null,
            quest: null,
            diceInventory: DEFAULT_DICE,
          }
        }
        if (version < 5) {
          state = {
            ...state,
            heroes: (state.heroes ?? []).map(h => ({
              ...h,
              potions: h.potions ?? [],
              comeback: h.comeback ?? 0,
              assistUsed: h.assistUsed ?? false,
            })),
          }
        }
        if (version < 6) {
          state = { ...state, chronicle: [] }
        }
        if (version < 7) {
          state = {
            ...state,
            themeRotation: state.themeRotation ?? 0,
            themeOverride: state.themeOverride ?? null,
            // A quest already in progress keeps NO theme: its villain was
            // invented without one, and back-filling would put a spine on an
            // adventure that never had it. The next new quest starts the cycle.
            quest: state.quest ? { ...state.quest, dilemmaAct: state.quest.dilemmaAct ?? null } : state.quest,
          }
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
