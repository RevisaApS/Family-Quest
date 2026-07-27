/**
 * Balance simulator — Monte Carlo over whole adventures.
 *
 * Not part of the normal test run: it is slow and prints a report rather than
 * asserting. Run it explicitly:
 *
 *   SIM=1 npx vitest run tests/sim
 *
 * Every number in the game's balance comments came from this harness. When you
 * want to re-tune, add a candidate TUNINGS entry, run it, compare, and only
 * then edit src/lib/game/*.ts. The `fidelity` test below fails if the sim's own
 * copy of the maths drifts from the shipped code.
 */
import { describe, it, expect } from 'vitest'
import type { Stat, OutcomeType, CritType, SceneFit, EquipSlot } from '@/types/game'
import type { CharacterClass } from '@/types/game'
import { getClassStats } from '@/lib/game/classes'
import { skillChoices } from '@/lib/game/skills'
import { SHOP_CATALOG, type ShopItem } from '@/lib/game/shop'
import { PET_PRICE } from '@/lib/game/pets'
import { HEAL_POTION_HP } from '@/lib/game/potions'
import { calculateDC, resolveD20, PARTIAL_BAND, MILESTONE_DC, BOSS_DC } from '@/lib/game/mechanics'
import {
  XP_PER_OUTCOME, MAX_LEVEL, levelForXp, STARTING_GOLD, GOLD_PER_OUTCOME,
  CRIT_BONUS_GOLD, monsterGoldReward, BOSS_GOLD_REWARD, chestGoldAmount,
  MONSTER_XP_REWARD, BOSS_XP_REWARD, LEVEL_UP_HEAL,
  BASE_MAX_HP, MIN_HP, FUMBLE_RETALIATION_DAMAGE, maxHpForLevel,
  heroDamageForOutcome, encounterDamageForOutcome, encounterSpawnTurn,
  nextEncounterKind, encounterMaxHp, QUEST_MILESTONES, ASSIST_BONUS,
  COMEBACK_CAP, lootShouldDrop, lootBonusForRoll,
  WEAKNESS_BONUS_DAMAGE, applyTurnOutcome, createHero, MAX_POTIONS,
} from '@/lib/game/rpg'

// ---------------------------------------------------------------- tuning ---

interface Tuning {
  label: string
  /** DC_BASE for the difficulty being simulated (medium unless stated) */
  dcBase: number
  /** extra DC per completed milestone — the quest tightening as it goes */
  dcPerMilestone: number
  /** DC term for the hero's level: floor((level-1) / levelDcDivisor) */
  levelDcDivisor: number
  bossDcBump: number
  xp: Record<OutcomeType, number>
  xpMonster: number
  xpBoss: number
  levelXp: number[]
  startingGold: number
  gold: Record<OutcomeType, number>
  critGold: number
  /** party payout per monster; a function of milestones lets it escalate */
  monsterGold: number | ((milestonesDone: number) => number)
  bossGold: number
  chestGoldChance: number
  chestGold: (roll: number) => number
  /** hero damage: [out of fight failure, in-fight failure, in-fight partial] */
  failDamage: number
  fightFailDamage: number
  fightPartialDamage: number
  fumbleRetaliation: number
  minHp: number
  /** HP restored on level-up */
  levelUpHeal: (maxHp: number) => number
  /** price override per tier: [tier0, tier1, tier2, tier3] */
  tierPrices?: [number, number, number, number]
  petPrice?: number
}

/**
 * The game as it stands in src/lib/game/*. Anything the source does not export
 * (the DC table, the level curve, the damage numbers) is mirrored here by hand
 * and guarded by the fidelity test below.
 */
const SHIPPED: Tuning = {
  label: 'shipped (today)',
  dcBase: 14, // DC_BASE.medium
  dcPerMilestone: MILESTONE_DC,
  levelDcDivisor: 2,
  bossDcBump: BOSS_DC,
  xp: { ...XP_PER_OUTCOME },
  xpMonster: MONSTER_XP_REWARD,
  xpBoss: BOSS_XP_REWARD,
  levelXp: [0, 0, 5, 10, 16, 23],
  startingGold: STARTING_GOLD,
  gold: { ...GOLD_PER_OUTCOME },
  critGold: CRIT_BONUS_GOLD,
  monsterGold: monsterGoldReward,
  bossGold: BOSS_GOLD_REWARD,
  chestGoldChance: 0.4,
  chestGold: chestGoldAmount,
  failDamage: 2,
  fightFailDamage: 3,
  fightPartialDamage: 2,
  fumbleRetaliation: FUMBLE_RETALIATION_DAMAGE,
  minHp: MIN_HP,
  levelUpHeal: () => LEVEL_UP_HEAL,
}

/**
 * The 2026-07-27 rebalance, measured over 4000 adventures with a party of 3:
 *   61% success / 20% partial / 19% failure   (was 77 / 15 / 8)
 *   6.3 damage per hero per quest             (was 2.2)
 *   someone knocked out in 45% of adventures  (was impossible)
 *   16 gold earned before the boss            (was 23)
 *   level 5 reached in ~64% of adventures     (was 89%)
 * Anything that moves those numbers should be run through here first.
 */

// ------------------------------------------------------------ sim engine ---

type Rng = () => number

const d20 = (rng: Rng) => Math.floor(rng() * 20) + 1
const pick = <T,>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)]

const STATS: Stat[] = ['strength', 'magic', 'agility', 'heart']
const SLOTS: EquipSlot[] = ['weapon', 'armor', 'helmet', 'trinket', 'boots']

interface SimHero {
  class: CharacterClass
  /** spenders buy every upgrade the moment they can; savers hold out for the good stuff */
  shopper: 'spender' | 'saver'
  level: number
  xp: number
  gold: number
  goldEarned: number
  goldEarnedBeforeBoss: number
  hp: number
  maxHp: number
  skills: { stat: Stat; bonus: number; power: string }[]
  equipment: Partial<Record<EquipSlot, { stat: Stat; bonus: number; tier: number }>>
  pet: { stat: Stat; bonus: number } | null
  potions: number
  usedPowers: string[]
  comeback: number
  assistUsed: boolean
  // metrics
  tier3AtBoss: boolean
  gearAtBoss: number
  bestStatAtBoss: number
  damageTaken: number
  levelUps: number
  xpEarned: number
  knockdowns: number
  lowestHp: number
}

function makeHero(cls: CharacterClass, t: Tuning, shopper: 'spender' | 'saver' = 'spender'): SimHero {
  return {
    class: cls, shopper, level: 1, xp: 0, gold: t.startingGold, goldEarned: 0,
    goldEarnedBeforeBoss: 0,
    hp: BASE_MAX_HP, maxHp: BASE_MAX_HP, skills: [], equipment: {}, pet: null,
    potions: 0, usedPowers: [], comeback: 0, assistUsed: false, tier3AtBoss: false,
    gearAtBoss: 0, bestStatAtBoss: 0,
    damageTaken: 0, levelUps: 0, xpEarned: 0, knockdowns: 0, lowestHp: BASE_MAX_HP,
  }
}

function statBonus(h: SimHero, stat: Stat): number {
  const base = getClassStats(h.class)[stat]
  const skills = h.skills.filter(s => s.stat === stat).reduce((n, s) => n + s.bonus, 0)
  const gear = Object.values(h.equipment)
    .filter((i): i is { stat: Stat; bonus: number; tier: number } => !!i && i.stat === stat)
    .reduce((n, i) => n + i.bonus, 0)
  const pet = h.pet?.stat === stat ? h.pet.bonus : 0
  return base + skills + gear + pet
}

function levelFor(xp: number, t: Tuning): number {
  let level = 1
  for (let l = 2; l <= MAX_LEVEL; l++) if (xp >= t.levelXp[l]) level = l
  return level
}

function priceOf(item: ShopItem, t: Tuning): number {
  if (!t.tierPrices) return item.price
  // the Golden Helm stays the priciest thing in the game
  const premium = item.id === 'shop-helmet-3' ? 2 : 0
  return t.tierPrices[item.tier] + premium
}

/**
 * Two kinds of kid at the shop counter. The spender buys the biggest upgrade
 * they can afford the second they can afford it; the saver grabs the 1-gold
 * junk and then holds out for a legendary. Half the party is each.
 */
function shop(h: SimHero, t: Tuning, rng: Rng) {
  for (;;) {
    let best: ShopItem | null = null
    let bestGain = 0
    for (const item of SHOP_CATALOG) {
      const price = priceOf(item, t)
      if (price > h.gold) continue
      const owned = h.equipment[item.slot]
      const gain = item.bonus - (owned?.bonus ?? 0)
      const topPrice = priceOf(SHOP_CATALOG.find(i => i.tier === 3 && i.slot === item.slot)!, t)
      if (h.shopper === 'saver' && item.tier > 0 && item.tier < 3 && h.gold < topPrice + 6) continue
      if (gain > bestGain || (gain === bestGain && best && price < priceOf(best, t))) {
        best = item
        bestGain = gain
      }
    }
    if (!best || bestGain <= 0) break
    h.gold -= priceOf(best, t)
    h.equipment[best.slot] = { stat: best.stat, bonus: best.bonus, tier: best.tier }
  }
  const equipped = Object.keys(h.equipment).length
  const ownsTier3 = Object.values(h.equipment).some(i => i && i.tier === 3)
  const petPrice = t.petPrice ?? PET_PRICE
  if (!h.pet && equipped >= 3 && h.gold >= petPrice && (h.shopper === 'spender' || ownsTier3)) {
    h.gold -= petPrice
    h.pet = { stat: pick(rng, STATS), bonus: 1 }
  }
  // A hero saving for a legendary won't blow the purse on drinks
  const stillSaving = h.shopper === 'saver' && !ownsTier3
  if (!stillSaving && h.hp <= h.maxHp / 2 && h.potions < MAX_POTIONS && h.gold >= 3) {
    h.gold -= 3
    h.potions += 1
  }
}

function gainGold(h: SimHero, amount: number) {
  h.gold += amount
  h.goldEarned += amount
}

interface AdventureResult {
  turns: number
  outcomes: Record<OutcomeType, number>
  crits: number
  fumbles: number
  heroes: SimHero[]
  anyKnockdown: boolean
  anyAtOneHp: boolean
  tier3BeforeBoss: number
  goldAtBossStart: number
  bossTurns: number
  reachedLevel5: number
}

function simulateAdventure(t: Tuning, rng: Rng, partySize = 3): AdventureResult {
  const classes: CharacterClass[] = ['warrior', 'wizard', 'rogue', 'ranger']
  const heroes = Array.from({ length: partySize }, (_, i) =>
    makeHero(classes[i % 4], t, i % 2 === 0 ? 'spender' : 'saver'))

  let turns = 0
  let milestones = 0
  let encounter: { kind: 'monster' | 'boss'; hp: number; maxHp: number; enraged: boolean; weakStat: Stat | null } | null = null
  const outcomes: Record<OutcomeType, number> = { success: 0, partial: 0, failure: 0 }
  let crits = 0, fumbles = 0, bossTurns = 0, tier3BeforeBoss = 0, goldAtBossStart = 0
  let anyKnockdown = false, anyAtOneHp = false

  while (milestones < QUEST_MILESTONES && turns < 80) {
    if (!encounter && turns >= encounterSpawnTurn(milestones, partySize)) {
      const kind = nextEncounterKind(milestones)
      const maxHp = encounterMaxHp(kind, milestones, partySize)
      encounter = { kind, hp: maxHp, maxHp, enraged: false, weakStat: null }
      if (kind === 'boss') {
        tier3BeforeBoss = heroes.reduce(
          (n, h) => n + Object.values(h.equipment).filter(i => i && i.tier === 3).length, 0)
        goldAtBossStart = heroes.reduce((n, h) => n + h.gold, 0) / partySize
        for (const h of heroes) {
          h.goldEarnedBeforeBoss = h.goldEarned
          h.tier3AtBoss = Object.values(h.equipment).some(i => i && i.tier === 3)
          h.gearAtBoss = Object.values(h.equipment).reduce((n, i) => n + (i?.bonus ?? 0), 0)
          h.bestStatAtBoss = Math.max(...STATS.map(s => statBonus(h, s)))
        }
      }
    }

    const hero = heroes[turns % partySize]
    shop(hero, t, rng)

    // A knocked-out hero is helped back up at the start of their own turn
    if (hero.hp <= 0) {
      hero.hp = Math.ceil(hero.maxHp / 2)
    }

    const encActive = !!encounter
    const fit: SceneFit = rng() < 0.35 ? 'good' : rng() < 0.7 ? 'okay' : 'risky'
    const ranked = [...STATS].sort((a, b) => statBonus(hero, b) - statBonus(hero, a))
    const r = rng()
    const stat = r < 0.55 ? ranked[0] : r < 0.8 ? ranked[1] : pick(rng, ranked.slice(2))

    const dc =
      t.dcBase +
      (fit === 'good' ? -2 : fit === 'risky' ? 2 : 0) +
      Math.floor((hero.level - 1) / t.levelDcDivisor) +
      (encActive ? 1 : 0) +
      milestones * t.dcPerMilestone +
      (encounter?.kind === 'boss' ? t.bossDcBump : 0)

    // Determination + a sibling lending a hand
    let bonus = hero.comeback
    const helper = heroes.find(h => h !== hero && !h.assistUsed)
    if (helper && rng() < 0.5) {
      helper.assistUsed = true
      bonus += ASSIST_BONUS
    }
    if (hero.potions > 0 && hero.hp <= 2) {
      hero.potions -= 1
      hero.hp = Math.min(hero.maxHp, hero.hp + HEAL_POTION_HP)
    }

    let roll = d20(rng)
    let res = resolveD20(roll, statBonus(hero, stat) + bonus, dc)
    // Second Chance, then Rally — the two powers a kid actually spends on a miss
    if (res.outcome === 'failure' && hero.skills.some(s => s.power === 'reroll') && !hero.usedPowers.includes('reroll')) {
      hero.usedPowers.push('reroll')
      roll = d20(rng)
      res = resolveD20(roll, statBonus(hero, stat) + bonus, dc)
    }
    if (res.outcome !== 'success' && res.crit !== 'fumble'
        && hero.skills.some(s => s.power === 'rally') && !hero.usedPowers.includes('rally')) {
      hero.usedPowers.push('rally')
      res = resolveD20(roll, statBonus(hero, stat) + bonus + 3, dc)
    }

    outcomes[res.outcome]++
    if (res.crit === 'crit') crits++
    if (res.crit === 'fumble') fumbles++

    // --- rewards & damage (the tuned part) ---
    const xpGained = t.xp[res.outcome]
    const goldGained = t.gold[res.outcome] + (res.crit === 'crit' ? t.critGold : 0)
    let damage = res.outcome === 'failure'
      ? (encActive ? t.fightFailDamage : t.failDamage)
        + (res.crit === 'fumble' && encActive ? t.fumbleRetaliation : 0)
      : res.outcome === 'partial'
        ? (encActive ? t.fightPartialDamage : 0)
        : 0

    if (damage >= 2 && hero.skills.some(s => s.power === 'shield') && !hero.usedPowers.includes('shield')) {
      hero.usedPowers.push('shield')
      damage = 0
    }

    hero.xp += xpGained
    hero.xpEarned += xpGained
    gainGold(hero, goldGained)
    hero.damageTaken += damage
    hero.hp = Math.max(t.minHp, hero.hp - damage)
    if (hero.hp <= 0) { hero.knockdowns++; anyKnockdown = true }
    if (hero.hp === 1) anyAtOneHp = true
    hero.lowestHp = Math.min(hero.lowestHp, hero.hp)
    hero.comeback = res.outcome === 'failure'
      ? Math.min(COMEBACK_CAP, hero.comeback + 1)
      : res.outcome === 'success' ? 0 : hero.comeback
    hero.assistUsed = false

    const newLevel = Math.min(levelFor(hero.xp, t), MAX_LEVEL)
    if (newLevel > hero.level) {
      hero.levelUps += newLevel - hero.level
      hero.level = newLevel
      hero.maxHp = maxHpForLevel(newLevel)
      hero.hp = Math.min(hero.maxHp, Math.max(hero.hp, t.minHp) + t.levelUpHeal(hero.maxHp))
      const choice = skillChoices(hero.class, [], 'da')[0]
      if (choice) hero.skills.push({ stat: choice.stat, bonus: choice.bonus, power: choice.power! })
    }

    // A friend patches up whoever is worst off
    const hurt = [...heroes].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (hurt.hp <= hurt.maxHp * 0.35) {
      const healer = heroes.find(h => h.skills.some(s => s.power === 'heal') && !h.usedPowers.includes('heal'))
      if (healer) {
        healer.usedPowers.push('heal')
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + 3)
      }
    }

    // --- the shared enemy ---
    let monsterDown = false
    if (encounter) {
      if (encounter.kind === 'boss') bossTurns++
      const base = encounterDamageForOutcome(res.outcome, res.crit)
      const dealt = base + (encounter.enraged && encounter.weakStat === stat && base > 0 ? WEAKNESS_BONUS_DAMAGE : 0)
      encounter.hp = Math.max(0, encounter.hp - dealt)
      if (encounter.kind === 'boss' && !encounter.enraged && encounter.hp > 0
          && encounter.hp <= Math.floor(encounter.maxHp / 2)) {
        encounter.enraged = true
        encounter.weakStat = pick(rng, STATS)
      }
      if (encounter.hp === 0) {
        monsterDown = true
        const payout = encounter.kind === 'boss'
          ? t.bossGold
          : typeof t.monsterGold === 'function' ? t.monsterGold(milestones) : t.monsterGold
        const partyXp = encounter.kind === 'boss' ? t.xpBoss : t.xpMonster
        for (const h of heroes) {
          gainGold(h, payout)
          h.xp += partyXp
          h.xpEarned += partyXp
          const lvl = Math.min(levelFor(h.xp, t), MAX_LEVEL)
          if (lvl > h.level) {
            h.levelUps += lvl - h.level
            h.level = lvl
            h.maxHp = maxHpForLevel(lvl)
            h.hp = Math.min(h.maxHp, Math.max(h.hp, t.minHp) + t.levelUpHeal(h.maxHp))
            const choice = skillChoices(h.class, [], 'da')[0]
            if (choice) h.skills.push({ stat: choice.stat, bonus: choice.bonus, power: choice.power! })
          }
        }
        milestones++
        encounter = null
      }
    }

    // --- treasure ---
    if (lootShouldDrop(res.outcome, roll, res.crit) || monsterDown) {
      if (!monsterDown && rng() < t.chestGoldChance) {
        gainGold(hero, t.chestGold(roll))
      } else {
        const slot = pick(rng, SLOTS)
        const itemStat = pick(rng, STATS)
        const b = lootBonusForRoll(roll)
        const owned = hero.equipment[slot]
        if (!owned || b > owned.bonus) hero.equipment[slot] = { stat: itemStat, bonus: b, tier: 0 }
      }
    }

    turns++
  }

  return {
    turns,
    outcomes,
    crits,
    fumbles,
    heroes,
    anyKnockdown,
    anyAtOneHp,
    tier3BeforeBoss,
    goldAtBossStart,
    bossTurns,
    reachedLevel5: heroes.filter(h => h.level === 5).length,
  }
}

// --------------------------------------------------------------- reporting ---

function mulberry32(seed: number): Rng {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function report(t: Tuning, runs = 4000, partySize = 3) {
  const rng = mulberry32(20260727)
  const acc = {
    turns: 0, success: 0, partial: 0, failure: 0, total: 0,
    level: 0, levelUps: 0, xp: 0, goldEarned: 0, goldPreBoss: 0, goldLeft: 0, damage: 0,
    lowestHp: 0, knockdowns: 0, anyKnockdown: 0, anyAtOneHp: 0,
    tier3: 0, tier3Any: 0, goldAtBoss: 0, bossTurns: 0, level5: 0,
    savers: 0, saverTier3: 0, gearAtBoss: 0, bestStatAtBoss: 0,
  }
  for (let i = 0; i < runs; i++) {
    const r = simulateAdventure(t, rng, partySize)
    acc.turns += r.turns
    acc.success += r.outcomes.success
    acc.partial += r.outcomes.partial
    acc.failure += r.outcomes.failure
    acc.total += r.outcomes.success + r.outcomes.partial + r.outcomes.failure
    acc.anyKnockdown += r.anyKnockdown ? 1 : 0
    acc.anyAtOneHp += r.anyAtOneHp ? 1 : 0
    acc.tier3 += r.tier3BeforeBoss
    acc.tier3Any += r.tier3BeforeBoss > 0 ? 1 : 0
    acc.goldAtBoss += r.goldAtBossStart
    acc.bossTurns += r.bossTurns
    acc.level5 += r.reachedLevel5 / partySize
    for (const h of r.heroes) {
      acc.level += h.level
      acc.levelUps += h.levelUps
      acc.xp += h.xpEarned
      acc.goldEarned += h.goldEarned
      acc.goldPreBoss += h.goldEarnedBeforeBoss
      acc.goldLeft += h.gold
      acc.gearAtBoss += h.gearAtBoss
      acc.bestStatAtBoss += h.bestStatAtBoss
      if (h.shopper === 'saver') {
        acc.savers++
        if (h.tier3AtBoss) acc.saverTier3++
      }
      acc.damage += h.damageTaken
      acc.lowestHp += h.lowestHp
      acc.knockdowns += h.knockdowns
    }
  }
  const perHero = runs * partySize
  const pct = (n: number) => `${(100 * n).toFixed(0)}%`
  const num = (n: number) => n.toFixed(2)
  console.log(`\n── ${t.label} ─────────────────────────────`)
  console.log(`  turns/adventure        ${num(acc.turns / runs)}   (boss fight ${num(acc.bossTurns / runs)} turns)`)
  console.log(`  success / partial / fail  ${pct(acc.success / acc.total)} / ${pct(acc.partial / acc.total)} / ${pct(acc.failure / acc.total)}`)
  console.log(`  end level              ${num(acc.level / perHero)}  (level-ups ${num(acc.levelUps / perHero)}, hit lvl5 ${pct(acc.level5 / runs)})`)
  console.log(`  XP earned / hero       ${num(acc.xp / perHero)}`)
  console.log(`  gold earned / hero     ${num(acc.goldEarned / perHero)}  (before the boss ${num(acc.goldPreBoss / perHero)}, unspent at end ${num(acc.goldLeft / perHero)})`)
  console.log(`  gold/hero when boss arrives  ${num(acc.goldAtBoss / runs)}`)
  console.log(`  at the boss: gear bonus ${num(acc.gearAtBoss / perHero)}, best stat ${num(acc.bestStatAtBoss / perHero)}`)
  console.log(`  tier-3 worn before boss  ${num(acc.tier3 / runs)} items  (party: ${pct(acc.tier3Any / runs)}, savers who got one: ${pct(acc.saverTier3 / Math.max(1, acc.savers))})`)
  console.log(`  damage taken / hero    ${num(acc.damage / perHero)}   lowest HP ${num(acc.lowestHp / perHero)}`)
  console.log(`  someone at 1 HP        ${pct(acc.anyAtOneHp / runs)}    knock-outs/adventure ${num(acc.knockdowns / runs)} (any: ${pct(acc.anyKnockdown / runs)})`)
}

// ------------------------------------------------------------------ suite ---

// Add candidates here when re-tuning, e.g.
//   { ...SHIPPED, dcBase: 15, label: 'harder' },
//   { ...SHIPPED, minHp: 1, label: 'no knock-outs' },
// then run and compare against the shipped line.
const CANDIDATES: Tuning[] = []

describe.skipIf(!process.env.SIM)('balance simulation', () => {
  it('sim maths still matches the shipped code', () => {
    // DC
    for (const level of [1, 3, 5]) {
      for (const milestonesDone of [0, 1, 2]) {
        for (const bossFight of [false, true]) {
          const shippedDc = calculateDC({
            difficulty: 'medium', sceneFit: 'okay', level, encounterActive: true,
            milestonesDone, bossFight,
          })
          const simDc = SHIPPED.dcBase
            + Math.floor((level - 1) / SHIPPED.levelDcDivisor)
            + 1
            + milestonesDone * SHIPPED.dcPerMilestone
            + (bossFight ? SHIPPED.bossDcBump : 0)
          expect(simDc).toBe(shippedDc)
        }
      }
    }
    // level curve
    for (const xp of [0, 4, 5, 9, 10, 15, 16, 22, 23, 30]) {
      expect(levelFor(xp, SHIPPED)).toBe(levelForXp(xp))
    }
    // per-turn rewards & damage
    for (const outcome of ['success', 'partial', 'failure'] as OutcomeType[]) {
      for (const encActive of [false, true]) {
        for (const crit of [null, 'crit', 'fumble'] as CritType[]) {
          const real = applyTurnOutcome(createHero('p1'), outcome, encActive, crit)
          const simXp = SHIPPED.xp[outcome]
          const simGold = SHIPPED.gold[outcome] + (crit === 'crit' ? SHIPPED.critGold : 0)
          const simDamage = outcome === 'failure'
            ? (encActive ? SHIPPED.fightFailDamage : SHIPPED.failDamage)
              + (crit === 'fumble' && encActive ? SHIPPED.fumbleRetaliation : 0)
            : outcome === 'partial' ? (encActive ? SHIPPED.fightPartialDamage : 0) : 0
          expect(simXp).toBe(real.xpGained)
          expect(simGold).toBe(real.goldGained)
          expect(simDamage).toBe(heroDamageForOutcome(outcome, encActive, crit))
          expect(simDamage).toBe(real.damageTaken)
        }
      }
    }
    expect(PARTIAL_BAND).toBe(4)
  })

  it('reports', () => {
    report(SHIPPED)
    for (const c of CANDIDATES) report(c)
  }, 300_000)
})
