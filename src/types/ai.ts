import type { Stat, SceneFit, AdventureStyle, CharacterClass } from './game'
import type { Language } from '@/lib/ai/language'

export interface GeneratedScene {
  narration: string
  imagePrompt: string
  suggestedNextPlayer: string
  // Only set when the scene introduces a monster or the boss
  encounterName?: string
  // Only set on the very first scene of an adventure
  questTitle?: string
  questGoal?: string
}

export interface HeroRpgContext {
  level: number
  hp: number
  maxHp: number
  knockedOut: boolean
  skillNames: string[]
  gearNames: string[]
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
  encounter?: { kind: 'monster' | 'boss'; name: string; hp: number; maxHp: number } | null
  quest?: { title: string; goal: string; milestonesDone: number } | null
  isFirstScene?: boolean
}
