import type { AdventureStyle, CharacterClass, TurnRecord } from '@/types/game'

// The family's chronicle: one record per completed quest, kept forever.
// This is what the Hall of Heroes celebrates — villains beaten, tales told,
// awards earned — while the per-adventure RPG state resets each time.

export interface HeroAward {
  title: string
  reason: string
}

export interface ChronicleHero {
  playerId: string
  playerName: string
  characterName: string
  class: CharacterClass
  level: number
  petName?: string
  turns: number
  successes: number
  crits: number
  fumbles: number
  award?: HeroAward
}

export interface CompletedAdventure {
  id: string
  completedAt: number
  questTitle: string
  questGoal: string
  villain?: string
  style: AdventureStyle
  // The AI-written storybook epilogue (absent when it couldn't be reached)
  tale?: { title: string; story: string }
  heroes: ChronicleHero[]
}

export interface PlayerTurnStats {
  turns: number
  successes: number
  crits: number
  fumbles: number
}

// Crits and fumbles are re-derived from the recorded d20 (nat 20 / nat 1) —
// TurnRecord predates crit tracking.
export function turnStatsForPlayer(turnHistory: TurnRecord[], playerId: string): PlayerTurnStats {
  const own = turnHistory.filter(t => t.playerId === playerId)
  return {
    turns: own.length,
    successes: own.filter(t => t.outcome === 'success').length,
    crits: own.filter(t => t.diceRoll === 20).length,
    fumbles: own.filter(t => t.diceRoll === 1).length,
  }
}

// One player's lifetime totals across the whole chronicle.
export interface PlayerHallStats {
  adventures: number
  crits: number
  successes: number
  awards: Array<HeroAward & { questTitle: string }>
}

export function playerHallStats(chronicle: CompletedAdventure[], playerId: string): PlayerHallStats {
  const entries = chronicle
    .map(record => ({ record, hero: record.heroes.find(h => h.playerId === playerId) }))
    .filter((e): e is { record: CompletedAdventure; hero: ChronicleHero } => !!e.hero)
  return {
    adventures: entries.length,
    crits: entries.reduce((sum, e) => sum + e.hero.crits, 0),
    successes: entries.reduce((sum, e) => sum + e.hero.successes, 0),
    awards: entries
      .filter(e => e.hero.award)
      .map(e => ({ ...e.hero.award!, questTitle: e.record.questTitle })),
  }
}

// Every villain the family has ever brought down.
export function defeatedVillains(chronicle: CompletedAdventure[]): Array<{ villain: string; questTitle: string; completedAt: number }> {
  return chronicle
    .filter(r => r.villain)
    .map(r => ({ villain: r.villain!, questTitle: r.questTitle, completedAt: r.completedAt }))
}
