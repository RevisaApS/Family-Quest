import type { HeroState, OutcomeType, Stat, Skill, LootItem, BossState } from '@/types/game'
import { getClassStats } from './classes'
import type { CharacterClass } from '@/types/game'

// --- XP & levels (per-adventure progression, resets on new adventure) ---

export const XP_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 3,
  partial: 2,
  failure: 1,
}

// --- Gold economy ---
// Heroes start nearly broke (1 gold buys the hilariously bad starter gear).
// Session math for one kid: ~6 turns before the boss earns ~8-12 gold
// (turns + chest pouches), the boss pays out big — tier-3 gear is a
// post-boss trophy purchase.
export const STARTING_GOLD = 1

export const GOLD_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 2,
  partial: 1,
  failure: 0,
}

export const BOSS_GOLD_REWARD = 20

// A chest is either an item or a pouch of coins — the dice roll sets the size.
export function chestIsGold(): boolean {
  return Math.random() < 0.4
}

export function chestGoldAmount(diceRoll: number): number {
  return diceRoll + 2
}

export const MAX_LEVEL = 5

// Cumulative XP needed to REACH each level. Level 2 comes fast (early win),
// later levels stretch out across a 30-45 minute session.
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

// --- HP & damage ---

export const BASE_MAX_HP = 6
export const HP_PER_LEVEL = 1

export function maxHpForLevel(level: number): number {
  return BASE_MAX_HP + (level - 1) * HP_PER_LEVEL
}

export function heroDamageForOutcome(outcome: OutcomeType, bossActive: boolean): number {
  if (outcome === 'failure') return bossActive ? 2 : 1
  if (outcome === 'partial') return bossActive ? 1 : 0
  return 0
}

export function bossDamageForOutcome(outcome: OutcomeType): number {
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

// Heroes get stronger every level, so thresholds climb with them — the numbers
// grow (which feels great) while the odds stay balanced.
export function levelThresholdAdjustment(level: number): number {
  return level - 1
}

// --- Loot drops ---

// Loot on a strong success: the dice themselves decide, so kids can see it coming.
export function lootShouldDrop(outcome: OutcomeType, diceRoll: number): boolean {
  return outcome === 'success' && diceRoll >= 4
}

export function lootBonusForRoll(diceRoll: number): number {
  return diceRoll === 6 ? 2 : 1
}

// --- Boss encounter ---

// The boss shows up once every hero has had a handful of turns.
export const TURNS_PER_HERO_BEFORE_BOSS = 4

export function bossArrivalTurn(partySize: number): number {
  return partySize * TURNS_PER_HERO_BEFORE_BOSS
}

export function bossMaxHp(partySize: number): number {
  return partySize * 3 + 2
}

export function createBoss(name: string, partySize: number): BossState {
  const maxHp = bossMaxHp(partySize)
  return { name, hp: maxHp, maxHp, defeated: false }
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

// Apply one turn's outcome to the acting hero: XP, damage, KO, level-up
// (level-up raises max HP and fully heals — the skill pick happens in the UI).
export function applyTurnOutcome(
  hero: HeroState,
  outcome: OutcomeType,
  bossActive: boolean
): TurnResolution {
  const xpGained = XP_PER_OUTCOME[outcome]
  const goldGained = GOLD_PER_OUTCOME[outcome]
  const damageTaken = heroDamageForOutcome(outcome, bossActive)

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
