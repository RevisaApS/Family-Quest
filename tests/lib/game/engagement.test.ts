import { describe, it, expect } from 'vitest'
import {
  createHero, applyTurnOutcome, heroStatBonus,
  nextComeback, COMEBACK_CAP,
  spendAssist, ASSIST_BONUS,
  shouldEnrage, enrageBoss, rollWeakStat, weaknessBonus, WEAKNESS_BONUS_DAMAGE,
  createEncounter,
  potionCount, addPotion, removePotion, buyPotion, buyPet, MAX_POTIONS,
} from '@/lib/game/rpg'
import { POTION_CATALOG, potionDefinition, HEAL_POTION_HP, LUCK_POTION_BONUS } from '@/lib/game/potions'
import { PET_CATALOG, toPet } from '@/lib/game/pets'
import type { Pet } from '@/types/game'

const wolf: Pet = toPet(PET_CATALOG[0], 'en')

describe('determination (comeback bonus)', () => {
  it('stacks on failure, holds on partial, clears on success', () => {
    expect(nextComeback(0, 'failure')).toBe(1)
    expect(nextComeback(1, 'failure')).toBe(2)
    expect(nextComeback(2, 'partial')).toBe(2)
    expect(nextComeback(2, 'success')).toBe(0)
  })

  it('caps so a long losing streak stays fair', () => {
    expect(nextComeback(COMEBACK_CAP, 'failure')).toBe(COMEBACK_CAP)
  })

  it('flows through turn resolution', () => {
    const hero = createHero('p1')
    const { hero: afterFail } = applyTurnOutcome(hero, 'failure', false)
    expect(afterFail.comeback).toBe(1)
    const { hero: afterWin } = applyTurnOutcome(afterFail, 'success', false)
    expect(afterWin.comeback).toBe(0)
  })
})

describe('teamwork assists', () => {
  it('helping spends the assist; your own turn recharges it', () => {
    const helper = spendAssist(createHero('p2'))
    expect(helper.assistUsed).toBe(true)
    const { hero: afterOwnTurn } = applyTurnOutcome(helper, 'partial', false)
    expect(afterOwnTurn.assistUsed).toBe(false)
  })

  it('assist bonus is a modest +1', () => {
    expect(ASSIST_BONUS).toBe(1)
  })
})

describe('boss phase 2 (weak spot)', () => {
  it('triggers at half HP, only for bosses, only once', () => {
    const boss = createEncounter('boss', 'Skyggekongen', 2, 2) // 8 max hp
    expect(shouldEnrage(boss)).toBe(false)
    expect(shouldEnrage({ ...boss, hp: 4 })).toBe(true)
    expect(shouldEnrage({ ...boss, hp: 4, enraged: true })).toBe(false)
    expect(shouldEnrage({ ...boss, hp: 0, defeated: true })).toBe(false)
    const monster = createEncounter('monster', 'Skyggeuhyret', 0, 2)
    expect(shouldEnrage({ ...monster, hp: 1 })).toBe(false)
  })

  it('enraging reveals a weak stat and resets the announcement flag', () => {
    const boss = createEncounter('boss', 'Skyggekongen', 2, 2)
    const enraged = enrageBoss({ ...boss, hp: 4 }, 'magic')
    expect(enraged.enraged).toBe(true)
    expect(enraged.weakStat).toBe('magic')
    expect(enraged.enrageAnnounced).toBe(false)
  })

  it('rolls one of the four stats', () => {
    for (let i = 0; i < 20; i++) {
      expect(['strength', 'magic', 'agility', 'heart']).toContain(rollWeakStat())
    }
  })

  it('weak-spot hits deal bonus damage — but a miss is still a miss', () => {
    const enraged = { enraged: true, weakStat: 'magic' as const }
    expect(weaknessBonus(enraged, 'magic', 2)).toBe(WEAKNESS_BONUS_DAMAGE)
    expect(weaknessBonus(enraged, 'strength', 2)).toBe(0)
    expect(weaknessBonus(enraged, 'magic', 0)).toBe(0)
    expect(weaknessBonus({ enraged: false, weakStat: 'magic' }, 'magic', 2)).toBe(0)
    expect(weaknessBonus(null, 'magic', 2)).toBe(0)
  })
})

describe('potions', () => {
  it('has names and descriptions in both languages', () => {
    for (const potion of POTION_CATALOG) {
      expect(potion.name.da).toBeTruthy()
      expect(potion.name.en).toBeTruthy()
      expect(potion.description.da).toBeTruthy()
      expect(potion.description.en).toBeTruthy()
    }
    expect(potionDefinition('heal').price).toBeGreaterThan(0)
    expect(HEAL_POTION_HP).toBeGreaterThan(0)
    expect(LUCK_POTION_BONUS).toBeGreaterThan(0)
  })

  it('backpack adds, counts and removes single doses', () => {
    let hero = createHero('p1')
    hero = addPotion(addPotion(hero, 'heal'), 'heal')
    expect(potionCount(hero, 'heal')).toBe(2)
    hero = removePotion(hero, 'heal')
    expect(potionCount(hero, 'heal')).toBe(1)
    // removing a potion you don't have is a no-op
    expect(removePotion(hero, 'luck')).toBe(hero)
  })

  it('buying checks gold and the backpack cap', () => {
    const broke = createHero('p1') // 1 starting gold
    expect(buyPotion(broke, 'heal', 3)).toBeNull()
    const rich = { ...createHero('p1'), gold: 20 }
    const bought = buyPotion(rich, 'heal', 3)!
    expect(bought.gold).toBe(17)
    expect(potionCount(bought, 'heal')).toBe(1)
    const full = { ...rich, potions: Array(MAX_POTIONS).fill('heal' as const) }
    expect(buyPotion(full, 'luck', 4)).toBeNull()
  })
})

describe('pets', () => {
  it('covers all four stats with names in both languages', () => {
    const stats = PET_CATALOG.map(p => p.stat)
    expect(new Set(stats).size).toBe(4)
    for (const pet of PET_CATALOG) {
      expect(pet.name.da).toBeTruthy()
      expect(pet.name.en).toBeTruthy()
      expect(pet.look).toBeTruthy()
    }
  })

  it('localizes the pet at purchase time', () => {
    expect(toPet(PET_CATALOG[0], 'da').name).toBe(PET_CATALOG[0].name.da)
    expect(toPet(PET_CATALOG[0], 'en').name).toBe(PET_CATALOG[0].name.en)
  })

  it('buying needs gold; a new pet swaps out the old one', () => {
    expect(buyPet(createHero('p1'), wolf, 15)).toBeNull()
    const rich = { ...createHero('p1'), gold: 40 }
    const withWolf = buyPet(rich, wolf, 15)!
    expect(withWolf.pet?.id).toBe(wolf.id)
    expect(withWolf.gold).toBe(25)
    const dragon = toPet(PET_CATALOG[1], 'en')
    const swapped = buyPet(withWolf, dragon, 15)!
    expect(swapped.pet?.id).toBe(dragon.id)
  })

  it('the pet boosts its stat', () => {
    const hero = { skills: [], equipment: {}, pet: wolf }
    // warrior strength base is 5, wolf pup adds 1
    expect(heroStatBonus('warrior', hero, 'strength')).toBe(6)
    expect(heroStatBonus('warrior', hero, 'magic')).toBe(1)
  })
})
