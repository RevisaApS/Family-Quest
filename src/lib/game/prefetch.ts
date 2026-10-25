// The next page, written while the family is still reading this one.
// Everything here is pure: the play page projects what the game will look like
// after "Videre", keys it, and later checks the key still holds.
import type { StoryContext } from '@/types/ai'
import type { HeroState, OutcomeType } from '@/types/game'
import { reviveHero } from './rpg'

// One line of story memory per turn. The meta sits in brackets and the prose
// stays purely in the story language, so no English leaks into the prompts.
export function turnSummaryLine(characterName: string, actionText: string | undefined, outcome: OutcomeType | null, narrative: string): string {
  const tag = outcome === 'success' ? '✓' : outcome === 'partial' ? '~' : '✗'
  return `[${characterName} · ${actionText} · ${tag}] ${narrative}`
}

export interface ProjectInput {
  storyHistory: string[]
  pendingLine: string
  maxHistory: number
  turnHistoryLength: number
  currentPlayerIndex: number
  playerIds: string[]
  heroes: HeroState[]
}

export function projectNextTurn(input: ProjectInput) {
  const storyHistory = [...input.storyHistory, input.pendingLine].slice(-input.maxHistory)
  const currentPlayerIndex = (input.currentPlayerIndex + 1) % input.playerIds.length
  const currentPlayerId = input.playerIds[currentPlayerIndex]
  // Mirrors loadScene: a knocked-out hero gets up by themselves when their own turn starts
  const down = input.heroes.find(h => h.playerId === currentPlayerId && h.knockedOut)
  const heroes = down ? input.heroes.map(h => (h === down ? reviveHero(h) : h)) : input.heroes
  return {
    storyHistory,
    turnHistoryLength: input.turnHistoryLength + 1,
    currentPlayerIndex,
    currentPlayerId,
    heroes,
    revivedPlayerId: down ? currentPlayerId : null,
  }
}

// The whole context is the key: the scene prompt weaves in gear, powers and
// pets, and the picture shows them, so any change at all means a new page.
// buildStoryContext always builds fields in the same order, so JSON is stable.
export function contextKey(c: StoryContext): string {
  return JSON.stringify(c)
}
