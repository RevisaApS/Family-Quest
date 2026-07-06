export type Stat = 'strength' | 'magic' | 'agility' | 'heart'
export type CharacterClass = 'warrior' | 'wizard' | 'rogue' | 'ranger'
export type AdventureStyle = 'whimsical' | 'realistic' | 'dark'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SceneFit = 'good' | 'okay' | 'risky'
export type OutcomeType = 'success' | 'partial' | 'failure'
export type CritType = 'crit' | 'fumble' | null

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'
export type DiceInventory = Record<DiceType, number>

// Once-per-adventure special powers attached to level-up skills
export type PowerId = 'reroll' | 'shield' | 'heal' | 'rally' | 'lucky'

// One-shot drinks bought in the shop
export type PotionId = 'heal' | 'luck'

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

export type EquipSlot = 'weapon' | 'armor' | 'helmet' | 'trinket' | 'boots'

export interface LootItem {
  id: string
  slot: EquipSlot
  name: string
  emoji: string
  stat: Stat
  bonus: number
  // English visual description used in image prompts so equipped gear
  // actually appears on the hero in generated scenes
  look?: string
}

export interface Skill {
  id: string
  name: string
  emoji: string
  stat: Stat
  bonus: number
  description: string
  // The once-per-adventure special power this skill grants
  power: PowerId
  powerName: string
}

// A loyal companion bought in the shop — walks beside the hero in every
// generated scene image and boosts one stat.
export interface Pet {
  id: string
  name: string
  emoji: string
  stat: Stat
  bonus: number
  // English visual description used in image prompts
  look: string
}

export interface HeroState {
  playerId: string
  hp: number
  maxHp: number
  xp: number
  level: number
  gold: number
  skills: Skill[]
  usedPowers: PowerId[]
  equipment: Partial<Record<EquipSlot, LootItem>>
  knockedOut: boolean
  // One-shot drinks carried in the backpack
  potions: PotionId[]
  pet?: Pet
  // Determination: +1 per failed turn (capped), cleared by a success —
  // the struggling kid's next roll keeps getting easier
  comeback: number
  // True after helping a teammate's roll; recharges on the hero's own turn
  assistUsed: boolean
}

// Shared enemy the party takes down together — small monsters along the
// quest, the big boss at the end.
export interface EncounterState {
  kind: 'monster' | 'boss'
  name: string
  hp: number
  maxHp: number
  defeated: boolean
  // Boss phase 2: at half HP the boss transforms and reveals a weak spot —
  // actions using weakStat hit harder from then on
  enraged?: boolean
  weakStat?: Stat
  // The transformation scene has been narrated (so it's only told once)
  enrageAnnounced?: boolean
}

export interface Quest {
  title: string
  goal: string
  // The named villain behind it all — foreshadowed from scene 1, faced as
  // the boss in chapter 3
  villain?: string
  // Encounters beaten (0-3); 3 = boss down, quest complete
  milestonesDone: number
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
