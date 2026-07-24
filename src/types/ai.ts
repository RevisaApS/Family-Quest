import type { Stat, SceneFit, AdventureStyle, CharacterClass } from './game'
import type { Language } from '@/lib/ai/language'
import type { ValueThemeId } from '@/lib/game/values'

export interface GeneratedScene {
  narration: string
  imagePrompt: string
  suggestedNextPlayer: string
  // Only set when the scene introduces a monster or the boss
  encounterName?: string
  // Only set on the very first scene of an adventure
  questTitle?: string
  questGoal?: string
  villainName?: string
}

export interface HeroRpgContext {
  level: number
  hp: number
  maxHp: number
  knockedOut: boolean
  skillNames: string[]
  gearNames: string[]
  petName?: string
}

export type EncounterPhase =
  | 'none'
  | 'arriving-monster'
  | 'arriving-boss'
  | 'active'
  | 'just-defeated'

export interface GeneratedAction {
  id: string
  text: string
  stat: Stat
  sceneFit: SceneFit
  sceneFitReason: string
}

export interface GeneratedOutcome {
  narrative: string
}

export interface StoryContext {
  adventureStyle: AdventureStyle
  storyHistory: string[]
  characters: Array<{
    playerId: string
    playerName: string
    characterName: string
    class: CharacterClass
    rpg?: HeroRpgContext
  }>
  currentPlayerId: string
  language: Language
  encounterPhase?: EncounterPhase
  encounter?: {
    kind: 'monster' | 'boss'
    name: string
    hp: number
    maxHp: number
    // Boss phase 2: weak spot revealed at half HP. announceEnrage marks the
    // one scene that must narrate the transformation.
    enraged?: boolean
    weakStat?: Stat
    announceEnrage?: boolean
  } | null
  quest?: { title: string; goal: string; villain?: string; milestonesDone: number } | null
  isFirstScene?: boolean
  // The adventure's hidden values theme (src/lib/game/values.ts). Prompt
  // guidance only — the theme is never named in any player-facing text.
  valueTheme?: ValueThemeId
  // True when THIS scene carries the act's one dilemma: a tempting shortcut
  // with a named reward against the harder right thing that gives it up.
  dilemma?: boolean
  // Quests this family has already finished, oldest first. The chronicle was
  // being written after every victory and never read back, so each adventure
  // started with total amnesia about the last one.
  pastAdventures?: Array<{ questTitle: string; villain?: string }>
}
