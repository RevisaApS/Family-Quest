import type {
  HeroState, OutcomeType, Stat, Skill, LootItem, EncounterState, CritType, PowerId,
} from '@/types/game'
import { getClassStats } from './classes'
import type { CharacterClass } from '@/types/game'

// --- XP & levels (per-adventure progression, resets on new adventure) ---

export const XP_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 3,
  partial: 2,
  failure: 1,
}

export const MAX_LEVEL = 5

// Cumulative XP needed to REACH each level. Level 2 comes fast (early win),
// later levels stretch out across a 45-minute session.
const LEVEL_XP: number[] = [0, 0, 6, 14, 24, 36]

export function levelForXp(xp: number): number {
  let level = 1
  for (let l = 2; l <= MAX_LEVEL; l++) {
    if (xp >= LEVEL_XP[l]) level = l
  }
  return level
}

export function xpForNextLevel(level: number): number | null {
  return level >= MAX_LEVEL ? null : LEVEL_XP[level + 1]
}

// --- Gold economy ---
// Heroes start nearly broke (1 gold buys the hilariously bad starter gear).
// Gold flows from BEATING things: turns pay a little, monsters pay the party,
// the boss pays out big. Tier-3 gear is a post-boss trophy purchase.
export const STARTING_GOLD = 1

export const GOLD_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 2,
  partial: 1,
  failure: 0,
}

export const CRIT_BONUS_GOLD = 1
export const MONSTER_GOLD_REWARD = 3
export const BOSS_GOLD_REWARD = 20

// A chest is either an item or a pouch of coins — the d20 sets the size.
export function chestIsGold(): boolean {
  return Math.random() < 0.4
}

export function chestGoldAmount(d20Roll: number): number {
  return 4 + Math.ceil(d20Roll / 4) // 5-9
}

// --- HP & damage ---

export const BASE_MAX_HP = 6
export const HP_PER_LEVEL = 1

export function maxHpForLevel(level: number): number {
  return BASE_MAX_HP + (level - 1) * HP_PER_LEVEL
}

export function heroDamageForOutcome(outcome: OutcomeType, encounterActive: boolean): number {
  if (outcome === 'failure') return encounterActive ? 2 : 1
  if (outcome === 'partial') return encounterActive ? 1 : 0
  return 0
}

// Damage the party deals to a shared monster/boss. Crits hit twice as hard.
export function encounterDamageForOutcome(outcome: OutcomeType, crit: CritType): number {
  if (crit === 'crit') return 4
  if (outcome === 'success') return 2
  if (outcome === 'partial') return 1
  return 0
}

export function rescueHp(maxHp: number): number {
  return Math.ceil(maxHp / 2)
}

// --- Combined stat bonus: class + skills + equipped loot ---

export function heroStatBonus(
  characterClass: CharacterClass,
  hero: Pick<HeroState, 'skills' | 'equipment'>,
  stat: Stat
): number {
  const base = getClassStats(characterClass)[stat]
  const fromSkills = hero.skills.filter(s => s.stat === stat).reduce((sum, s) => sum + s.bonus, 0)
  const fromGear = Object.values(hero.equipment)
    .filter((item): item is LootItem => !!item && item.stat === stat)
    .reduce((sum, item) => sum + item.bonus, 0)
  return base + fromSkills + fromGear
}

// --- Loot drops (d20 scale) ---

// Loot on a crit or a strong success — the dice themselves decide.
export function lootShouldDrop(outcome: OutcomeType, d20Roll: number, crit: CritType): boolean {
  if (crit === 'crit') return true
  return outcome === 'success' && d20Roll >= 15
}

export function lootBonusForRoll(d20Roll: number): number {
  return d20Roll >= 18 ? 2 : 1
}

// --- Quest arc & encounters ---
// The 45-minute arc: cold-open monster at turn 0, a mid-quest monster once
// every hero has had ~3 turns, the boss after ~5 turns each. Three
// milestones = quest complete.
export const QUEST_MILESTONES = 3

export function encounterSpawnTurn(milestonesDone: number, partySize: number): number {
  if (milestonesDone === 0) return 0
  if (milestonesDone === 1) return partySize * 3
  return partySize * 5
}

export function nextEncounterKind(milestonesDone: number): 'monster' | 'boss' {
  return milestonesDone >= 2 ? 'boss' : 'monster'
}

export function encounterMaxHp(kind: 'monster' | 'boss', milestonesDone: number, partySize: number): number {
  if (kind === 'boss') return partySize * 3 + 2
  // the cold-open monster is a quick, confidence-building win
  return milestonesDone === 0 ? partySize * 2 + 1 : partySize * 3
}

export function createEncounter(
  kind: 'monster' | 'boss',
  name: string,
  milestonesDone: number,
  partySize: number
): EncounterState {
  const maxHp = encounterMaxHp(kind, milestonesDone, partySize)
  return { kind, name, hp: maxHp, maxHp, defeated: false }
}

// --- Hero lifecycle ---

export function createHero(playerId: string): HeroState {
  return {
    playerId,
    hp: BASE_MAX_HP,
    maxHp: BASE_MAX_HP,
    xp: 0,
    level: 1,
    gold: STARTING_GOLD,
    skills: [],
    usedPowers: [],
    equipment: {},
    knockedOut: false,
  }
}

export interface TurnResolution {
  hero: HeroState
  leveledUp: boolean
  damageTaken: number
  xpGained: number
  goldGained: number
}

// Apply one turn's outcome to the acting hero: XP, gold, damage, KO,
// level-up (level-up raises max HP and fully heals — the skill pick happens
// in the UI).
export function applyTurnOutcome(
  hero: HeroState,
  outcome: OutcomeType,
  encounterActive: boolean,
  crit: CritType = null
): TurnResolution {
  const xpGained = XP_PER_OUTCOME[outcome]
  const goldGained = GOLD_PER_OUTCOME[outcome] + (crit === 'crit' ? CRIT_BONUS_GOLD : 0)
  const damageTaken = heroDamageForOutcome(outcome, encounterActive)

  const xp = hero.xp + xpGained
  const newLevel = Math.min(levelForXp(xp), MAX_LEVEL)
  const leveledUp = newLevel > hero.level

  let maxHp = hero.maxHp
  let hp = Math.max(0, hero.hp - damageTaken)
  if (leveledUp) {
    maxHp = maxHpForLevel(newLevel)
    hp = maxHp
  }

  return {
    hero: {
      ...hero,
      xp,
      level: newLevel,
      gold: hero.gold + goldGained,
      maxHp,
      hp,
      knockedOut: hp === 0,
    },
    leveledUp,
    damageTaken,
    xpGained,
    goldGained,
  }
}

export function reviveHero(hero: HeroState): HeroState {
  return { ...hero, hp: rescueHp(hero.maxHp), knockedOut: false }
}

export function equipLoot(hero: HeroState, item: LootItem): HeroState {
  return { ...hero, equipment: { ...hero.equipment, [item.slot]: item } }
}

export function addGold(hero: HeroState, amount: number): HeroState {
  return { ...hero, gold: hero.gold + amount }
}

// Buying auto-equips into the item's slot; null when the hero can't afford it.
export function buyItem(hero: HeroState, item: LootItem, price: number): HeroState | null {
  if (hero.gold < price) return null
  return { ...equipLoot(hero, item), gold: hero.gold - price }
}

export function addSkill(hero: HeroState, skill: Skill): HeroState {
  if (hero.skills.some(s => s.id === skill.id)) return hero
  return { ...hero, skills: [...hero.skills, skill] }
}

// --- Once-per-adventure powers ---

export function heroPower(hero: HeroState, power: PowerId): Skill | undefined {
  return hero.skills.find(s => s.power === power)
}

export function canUsePower(hero: HeroState, power: PowerId): boolean {
  return !!heroPower(hero, power) && !hero.usedPowers.includes(power)
}

export function usePower(hero: HeroState, power: PowerId): HeroState {
  if (hero.usedPowers.includes(power)) return hero
  return { ...hero, usedPowers: [...hero.usedPowers, power] }
}

export function healHero(hero: HeroState, amount: number): HeroState {
  return { ...hero, hp: Math.min(hero.maxHp, hero.hp + amount), knockedOut: false }
}
