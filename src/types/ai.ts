import type { Stat, SceneFit, AdventureStyle, CharacterClass } from './game'
import type { Language } from '@/lib/ai/language'

export interface GeneratedScene {
  narration: string
  imagePrompt: string
  suggestedNextPlayer: string
}

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
  }>
  currentPlayerId: string
  language: Language
}
