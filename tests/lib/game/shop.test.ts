import { describe, it, expect } from 'vitest'
import { SHOP_CATALOG, shopItemsForSlot, toLootItem } from '@/lib/game/shop'
import { ALL_SLOTS, fallbackLootName, createLoot } from '@/lib/game/loot'
import {
  createHero, buyItem, addGold, GOLD_PER_OUTCOME, STARTING_GOLD,
  BOSS_GOLD_REWARD, MONSTER_GOLD_REWARD, chestGoldAmount, applyTurnOutcome,
} from '@/lib/game/rpg'

describe('shop catalog', () => {
  it('every slot has all four tiers', () => {
    for (const slot of ALL_SLOTS) {
      const items = shopItemsForSlot(slot)
      expect(items.map(i => i.tier).sort()).toEqual([0, 1, 2, 3])
    }
  })

  it('every slot has a 1-gold starter item that still gives +1 (bad, but never useless)', () => {
    for (const slot of ALL_SLOTS) {
      const starter = shopItemsForSlot(slot).find(i => i.tier === 0)!
      expect(starter.price).toBe(STARTING_GOLD)
      expect(starter.bonus).toBe(1)
    }
  })

  it('price and bonus rise strictly with tier within each slot', () => {
    for (const slot of ALL_SLOTS) {
      const items = shopItemsForSlot(slot).sort((a, b) => a.tier - b.tier)
      for (let i = 1; i < items.length; i++) {
        expect(items[i].price).toBeGreaterThan(items[i - 1].price)
        expect(items[i].bonus).toBeGreaterThan(items[i - 1].bonus)
      }
    }
  })

  it('the Golden Helm is the single most expensive item in the game', () => {
    const helm = SHOP_CATALOG.find(i => i.id === 'shop-helmet-3')!
    expect(helm.name.en).toBe('The Golden Helm')
    for (const item of SHOP_CATALOG) {
      if (item.id !== helm.id) expect(item.price).toBeLessThan(helm.price)
    }
  })

  it('every item has names in both languages and an English look for images', () => {
    for (const item of SHOP_CATALOG) {
      expect(item.name.da).toBeTruthy()
      expect(item.name.en).toBeTruthy()
      expect(item.look).toBeTruthy()
    }
  })

  it('toLootItem localizes and carries the look', () => {
    const helm = SHOP_CATALOG.find(i => i.id === 'shop-helmet-3')!
    const loot = toLootItem(helm, 'da')
    expect(loot.name).toBe('Den Gyldne Hjelm')
    expect(loot.look).toContain('golden helmet')
    expect(loot.slot).toBe('helmet')
  })
})

describe('gold economy', () => {
  it('heroes start with exactly 1 gold — enough for the starter item only', () => {
    const hero = createHero('p1')
    expect(hero.gold).toBe(STARTING_GOLD)
    const starter = shopItemsForSlot('helmet').find(i => i.tier === 0)!
    expect(buyItem(hero, toLootItem(starter, 'da'), starter.price)).not.toBeNull()
    const tier1 = shopItemsForSlot('helmet').find(i => i.tier === 1)!
    expect(buyItem(hero, toLootItem(tier1, 'da'), tier1.price)).toBeNull()
  })

  it('buying deducts gold and equips the item', () => {
    const helm = SHOP_CATALOG.find(i => i.id === 'shop-helmet-3')!
    const hero = addGold(createHero('p1'), helm.price - STARTING_GOLD) // exactly enough
    const after = buyItem(hero, toLootItem(helm, 'en'), helm.price)!
    expect(after.gold).toBe(0)
    expect(after.equipment.helmet?.name).toBe('The Golden Helm')
  })

  it('legendary gear is reachable from quest income, before the boss pays out', () => {
    // A hero banks ~1.4 gold per turn across ~7-8 turns of their own, plus a
    // share of both monster rewards. The boss's 20 lands after the quest is
    // already won, so it can't count toward affording anything.
    const questIncome = Math.round(7.6 * 1.4) + 2 * MONSTER_GOLD_REWARD
    const cheapestLegendary = Math.min(...SHOP_CATALOG.filter(i => i.tier === 3).map(i => i.price))
    expect(cheapestLegendary).toBeLessThanOrEqual(questIncome)
  })

  it('turns pay out gold by outcome (failure pays nothing)', () => {
    expect(GOLD_PER_OUTCOME.success).toBe(2)
    expect(GOLD_PER_OUTCOME.partial).toBe(1)
    expect(GOLD_PER_OUTCOME.failure).toBe(0)
    const { hero, goldGained } = applyTurnOutcome(createHero('p1'), 'success', false)
    expect(goldGained).toBe(2)
    expect(hero.gold).toBe(STARTING_GOLD + 2)
  })

  it('chest pouches scale with the d20, boss pays the big reward', () => {
    expect(chestGoldAmount(20)).toBe(9)
    expect(chestGoldAmount(15)).toBe(8)
    expect(BOSS_GOLD_REWARD).toBe(20)
  })

  it('found loot has fallback names for all five slots and a generic look', () => {
    for (const slot of ALL_SLOTS) {
      expect(fallbackLootName(slot, 'magic', 'da')).toBeTruthy()
      expect(createLoot(slot, 'magic', 1, 'x').look).toBeTruthy()
    }
  })
})
