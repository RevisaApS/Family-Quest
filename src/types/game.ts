export type Stat = 'strength' | 'magic' | 'agility' | 'heart'
export type CharacterClass = 'warrior' | 'wizard' | 'rogue' | 'ranger'
export type AdventureStyle = 'whimsical' | 'realistic' | 'dark'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SceneFit = 'good' | 'okay' | 'risky'
export type OutcomeType = 'success' | 'partial' | 'failure'

export interface ClassDefinition {
  name: CharacterClass
  displayName: string
  emoji: string
  description: string
  goodAt: string
  notGreatAt: string
  stats: Record<Stat, number>
}

export interface ActionOption {
  id: string
  text: string
  stat: Stat
  sceneFit: SceneFit
  sceneFitReason: string
}

export type EquipSlot = 'weapon' | 'armor' | 'trinket'

export interface LootItem {
  id: string
  slot: EquipSlot
  name: string
  emoji: string
  stat: Stat
  bonus: number
}

export interface Skill {
  id: string
  name: string
  emoji: string
  stat: Stat
  bonus: number
  description: string
}

export interface HeroState {
  playerId: string
  hp: number
  maxHp: number
  xp: number
  level: number
  skills: Skill[]
  equipment: Partial<Record<EquipSlot, LootItem>>
  knockedOut: boolean
}

export interface BossState {
  name: string
  hp: number
  maxHp: number
  defeated: boolean
}

export interface GameState {
  currentScene: string
  currentPlayerId: string
  turnHistory: TurnRecord[]
  storyHistory: string[]
}

export interface TurnRecord {
  playerId: string
  actionChosen: string
  stat: Stat
  sceneFit: SceneFit
  diceRoll: number
  outcome: OutcomeType
  narrativeResult: string
}
