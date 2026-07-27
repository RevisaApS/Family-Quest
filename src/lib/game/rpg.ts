import type {
  HeroState, OutcomeType, Stat, Skill, LootItem, EncounterState, CritType, PowerId,
  PotionId, Pet,
} from '@/types/game'
import { getClassStats } from './classes'
import type { CharacterClass } from '@/types/game'

// --- XP & levels (per-adventure progression, resets on new adventure) ---

// XP is for things you actually pulled off. A flat 1 XP for a failed roll made
// the bar creep up no matter what happened, which is exactly what it felt like
// at the table: levelling was something the clock did, not something you earned.
// A partial still counts — you got part of the way.
export const XP_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 3,
  partial: 1,
  failure: 0,
}

// Bringing a monster down is the party's win, so the party's XP. This is the
// other half of "you level up when you clear something": your own good turns,
// plus every monster the family beats together.
export const MONSTER_XP_REWARD = 2
export const BOSS_XP_REWARD = 4

export const MAX_LEVEL = 5

// Cumulative XP needed to REACH each level. A hero banks ~24 XP over a full
// quest (own successes plus the party's monster kills), so this curve puts
// level 5 at the end of a good adventure — reached in roughly two out of three
// runs, not handed out every time.
const LEVEL_XP: number[] = [0, 0, 5, 10, 16, 23]

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
// Gold is for WINNING, not for turning up: a clean success pays a single coin,
// and the real money is the purse a beaten monster drops on the whole party.
// Paying 2 a turn plus a 5-9 gold chest meant a hero could be eight coins rich
// on their first roll of the night, and the shop stopped being a decision.
export const STARTING_GOLD = 1

export const GOLD_PER_OUTCOME: Record<OutcomeType, number> = {
  success: 1,
  partial: 0,
  failure: 0,
}

export const CRIT_BONUS_GOLD = 1

// The deeper into the quest, the fatter the purse — so the big money lands in
// chapter 3, when there is finally something worth saving up for.
export function monsterGoldReward(milestonesDone: number): number {
  return 3 + 5 * milestonesDone // 3 for the first monster, 8 for the second
}

export const BOSS_GOLD_REWARD = 20

// A chest is either an item or a pouch of coins — the d20 sets the size.
export function chestIsGold(): boolean {
  return Math.random() < 0.4
}

export function chestGoldAmount(d20Roll: number): number {
  return 1 + Math.ceil(d20Roll / 7) // 2-4
}

// --- HP & damage ---

export const BASE_MAX_HP = 6
export const HP_PER_LEVEL = 1

// A hero CAN go down again. At 0 HP they sit out, grey and cheering, and their
// friends haul them back up at half HP the moment their own turn comes round —
// so nobody ever misses a turn, and the hearts finally mean something. Raise
// this to 1 to make the party unbreakable again.
export const MIN_HP = 0

// A natural 1 in a fight isn't only comedy — the monster gets a free swing.
// It's the sharpest spike of danger in the game.
export const FUMBLE_RETALIATION_DAMAGE = 2

export function maxHpForLevel(level: number): number {
  return BASE_MAX_HP + (level - 1) * HP_PER_LEVEL
}

// Getting hurt is the price of a fight. A half-landed blow in combat costs 2 —
// partials are common, and a monster that only punishes outright misses left
// the party arriving at the boss untouched.
export function heroDamageForOutcome(
  outcome: OutcomeType,
  encounterActive: boolean,
  crit: CritType = null
): number {
  if (outcome === 'failure') {
    const retaliation = crit === 'fumble' && encounterActive ? FUMBLE_RETALIATION_DAMAGE : 0
    return (encounterActive ? 3 : 2) + retaliation
  }
  if (outcome === 'partial') return encounterActive ? 2 : 0
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

// A second wind, not a full reset — and a small one, so a level-up can't wash
// away a whole fight's worth of scrapes.
export const LEVEL_UP_HEAL = 2

// --- Combined stat bonus: class + skills + equipped loot + pet ---

export function heroStatBonus(
  characterClass: CharacterClass,
  hero: Pick<HeroState, 'skills' | 'equipment' | 'pet'>,
  stat: Stat
): number {
  const base = getClassStats(characterClass)[stat]
  const fromSkills = hero.skills.filter(s => s.stat === stat).reduce((sum, s) => sum + s.bonus, 0)
  const fromGear = Object.values(hero.equipment)
    .filter((item): item is LootItem => !!item && item.stat === stat)
    .reduce((sum, item) => sum + item.bonus, 0)
  const fromPet = hero.pet && hero.pet.stat === stat ? hero.pet.bonus : 0
  return base + fromSkills + fromGear + fromPet
}

// --- Teamwork: assist a friend's roll ---
// One teammate can lend a hand before the dice hit the table. Helping spends
// the assist; taking your own turn recharges it — so siblings root for each
// other roughly once per rotation.

export const ASSIST_BONUS = 1

export function spendAssist(hero: HeroState): HeroState {
  return { ...hero, assistUsed: true }
}

// --- Determination (comeback bonus) ---
// Every failed turn stokes the hero's determination: +1 on the next roll,
// stacking up to the cap. A success clears it — partials keep the fire lit.

export const COMEBACK_CAP = 3

export function nextComeback(current: number, outcome: OutcomeType): number {
  if (outcome === 'failure') return Math.min(COMEBACK_CAP, current + 1)
  if (outcome === 'success') return 0
  return current
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
// The 45-minute arc: a quest-giver opening with no combat, the first monster
// once every hero has acted (min 2 turns), a mid-quest monster after ~3
// turns each, the boss after ~5 turns each. Three milestones = quest done.
export const QUEST_MILESTONES = 3

export function encounterSpawnTurn(milestonesDone: number, partySize: number): number {
  if (milestonesDone === 0) return Math.max(2, partySize)
  if (milestonesDone === 1) return partySize * 3
  return partySize * 5
}

export function nextEncounterKind(milestonesDone: number): 'monster' | 'boss' {
  return milestonesDone >= 2 ? 'boss' : 'monster'
}

export function encounterMaxHp(kind: 'monster' | 'boss', milestonesDone: number, partySize: number): number {
  if (kind === 'boss') return partySize * 3 + 2
  // the first monster is a quick, confidence-building win
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

// --- Boss phase 2 ---
// At half HP the boss transforms and reveals a weak spot: from then on,
// actions using that stat deal bonus damage. The kids coordinate who strikes.

export const WEAKNESS_BONUS_DAMAGE = 1

export function shouldEnrage(encounter: EncounterState): boolean {
  return (
    encounter.kind === 'boss' &&
    !encounter.enraged &&
    !encounter.defeated &&
    encounter.hp > 0 &&
    encounter.hp <= Math.floor(encounter.maxHp / 2)
  )
}

export function enrageBoss(encounter: EncounterState, weakStat: Stat): EncounterState {
  return { ...encounter, enraged: true, weakStat, enrageAnnounced: false }
}

export function rollWeakStat(): Stat {
  const stats: Stat[] = ['strength', 'magic', 'agility', 'heart']
  return stats[Math.floor(Math.random() * stats.length)]
}

// Extra damage when a hit lands on the revealed weak spot. Only hits that
// already hurt (baseDamage > 0) get the bonus — a miss is still a miss.
export function weaknessBonus(
  encounter: Pick<EncounterState, 'enraged' | 'weakStat'> | null,
  stat: Stat,
  baseDamage: number
): number {
  if (baseDamage <= 0 || !encounter?.enraged || encounter.weakStat !== stat) return 0
  return WEAKNESS_BONUS_DAMAGE
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
    potions: [],
    comeback: 0,
    assistUsed: false,
  }
}

export interface TurnResolution {
  hero: HeroState
  leveledUp: boolean
  damageTaken: number
  xpGained: number
  goldGained: number
}

// Apply one turn's outcome to the acting hero: XP, gold, damage, level-up
// (level-up raises max HP and grants a second wind — the skill pick happens
// in the UI).
export function applyTurnOutcome(
  hero: HeroState,
  outcome: OutcomeType,
  encounterActive: boolean,
  crit: CritType = null
): TurnResolution {
  const xpGained = XP_PER_OUTCOME[outcome]
  const goldGained = GOLD_PER_OUTCOME[outcome] + (crit === 'crit' ? CRIT_BONUS_GOLD : 0)
  const damageTaken = heroDamageForOutcome(outcome, encounterActive, crit)

  const xp = hero.xp + xpGained
  const newLevel = Math.min(levelForXp(xp), MAX_LEVEL)
  const leveledUp = newLevel > hero.level

  let maxHp = hero.maxHp
  let hp = Math.max(MIN_HP, hero.hp - damageTaken)
  if (leveledUp) {
    maxHp = maxHpForLevel(newLevel)
    hp = Math.min(maxHp, hp + LEVEL_UP_HEAL)
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
      comeback: nextComeback(hero.comeback, outcome),
      // Taking your own turn recharges your assist for the next teammate
      assistUsed: false,
    },
    leveledUp,
    damageTaken,
    xpGained,
    goldGained,
  }
}

// A monster the party brought down pays everyone, whoever landed the last hit.
// XP can push a hero over a level here, so this reports the level-up the same
// way a turn does — the UI queues a power pick for each hero who earned one.
export function applyPartyReward(
  hero: HeroState,
  gold: number,
  xp: number
): { hero: HeroState; leveledUp: boolean } {
  const newXp = hero.xp + xp
  const newLevel = Math.min(levelForXp(newXp), MAX_LEVEL)
  const leveledUp = newLevel > hero.level
  const maxHp = leveledUp ? maxHpForLevel(newLevel) : hero.maxHp
  const hp = leveledUp ? Math.min(maxHp, hero.hp + LEVEL_UP_HEAL) : hero.hp

  return {
    hero: {
      ...hero,
      gold: hero.gold + gold,
      xp: newXp,
      level: newLevel,
      maxHp,
      hp,
      knockedOut: hp === 0,
    },
    leveledUp,
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

// --- Potion backpack ---

export const MAX_POTIONS = 3

export function potionCount(hero: Pick<HeroState, 'potions'>, id: PotionId): number {
  return hero.potions.filter(p => p === id).length
}

export function addPotion(hero: HeroState, id: PotionId): HeroState {
  return { ...hero, potions: [...hero.potions, id] }
}

// Removes one dose; no-op when the backpack has none.
export function removePotion(hero: HeroState, id: PotionId): HeroState {
  const index = hero.potions.indexOf(id)
  if (index === -1) return hero
  return { ...hero, potions: hero.potions.filter((_, i) => i !== index) }
}

export function buyPotion(hero: HeroState, id: PotionId, price: number): HeroState | null {
  if (hero.gold < price || hero.potions.length >= MAX_POTIONS) return null
  return { ...addPotion(hero, id), gold: hero.gold - price }
}

// A hero keeps one pet; buying another swaps it out.
export function buyPet(hero: HeroState, pet: Pet, price: number): HeroState | null {
  if (hero.gold < price) return null
  return { ...hero, pet, gold: hero.gold - price }
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
