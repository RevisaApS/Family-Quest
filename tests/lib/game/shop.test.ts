import { describe, it, expect } from 'vitest'
import { SHOP_CATALOG, shopItemsForSlot, toLootItem } from '@/lib/game/shop'
import { ALL_SLOTS, fallbackLootName, createLoot } from '@/lib/game/loot'
import {
  createHero, buyItem, addGold, GOLD_PER_OUTCOME, STARTING_GOLD,
  BOSS_GOLD_REWARD, monsterGoldReward, chestGoldAmount, applyTurnOutcome,
} from '@/lib/game/rpg'

describe('shop catalog', () => {
  // An item line is one ladder of four tiers: swords, bows, armor, and so on.
  const lines = new Map<string, typeof SHOP_CATALOG>()
  for (const item of SHOP_CATALOG) {
    const line = item.id.replace(/-\d$/, '')
    lines.set(line, [...(lines.get(line) ?? []), item])
  }

  it('every slot is on sale', () => {
    for (const slot of ALL_SLOTS) expect(shopItemsForSlot(slot).length).toBeGreaterThan(0)
  })

  it('every item line has all four tiers, in one slot', () => {
    for (const items of lines.values()) {
      expect(items.map(i => i.tier).sort()).toEqual([0, 1, 2, 3])
      expect(new Set(items.map(i => i.slot)).size).toBe(1)
    }
  })

  it('every line has a 1-gold starter item that still gives +1 (bad, but never useless)', () => {
    for (const items of lines.values()) {
      const starter = items.find(i => i.tier === 0)!
      expect(starter.price).toBe(STARTING_GOLD)
      expect(starter.bonus).toBe(1)
    }
  })

  it('price and bonus rise strictly with tier within each line', () => {
    for (const items of lines.values()) {
      const sorted = [...items].sort((a, b) => a.tier - b.tier)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].price).toBeGreaterThan(sorted[i - 1].price)
        expect(sorted[i].bonus).toBeGreaterThan(sorted[i - 1].bonus)
      }
    }
  })

  it('bows are agility weapons that show a bow, not crossed swords', () => {
    const bows = lines.get('shop-bow')!
    expect(bows).toHaveLength(4)
    for (const bow of bows) {
      expect(bow.slot).toBe('weapon')
      expect(bow.stat).toBe('agility')
      expect(toLootItem(bow, 'da').emoji).toBe('🏹')
    }
    const sword = SHOP_CATALOG.find(i => i.id === 'shop-weapon-1')!
    expect(toLootItem(sword, 'da').emoji).toBe('⚔️')
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

  it('legendary gear is reachable from quest income — but only if you save', () => {
    // Simulated over 4000 adventures: a hero banks ~16 gold before the boss
    // arrives (own successes, a share of both monsters, the odd chest). The
    // boss's 20 lands after the quest is already won, so it can't count.
    const questIncome = 16
    const cheapestLegendary = Math.min(...SHOP_CATALOG.filter(i => i.tier === 3).map(i => i.price))
    expect(cheapestLegendary).toBeLessThanOrEqual(questIncome)
    // ...and it has to cost enough that buying one means going without
    const fullKitOfTier2 = 5 * SHOP_CATALOG.find(i => i.tier === 2)!.price
    expect(cheapestLegendary).toBeLessThan(fullKitOfTier2)
  })

  it('gold is for winning, not for turning up', () => {
    expect(GOLD_PER_OUTCOME.success).toBe(1)
    expect(GOLD_PER_OUTCOME.partial).toBe(0)
    expect(GOLD_PER_OUTCOME.failure).toBe(0)
    const { hero, goldGained } = applyTurnOutcome(createHero('p1'), 'success', false)
    expect(goldGained).toBe(1)
    expect(hero.gold).toBe(STARTING_GOLD + 1)
  })

  it('the real money is monsters, and later ones pay more', () => {
    expect(monsterGoldReward(0)).toBe(3)
    expect(monsterGoldReward(1)).toBe(8)
    expect(monsterGoldReward(1)).toBeGreaterThan(monsterGoldReward(0))
    expect(BOSS_GOLD_REWARD).toBe(20)
  })

  // A 5-9 gold pouch on turn one made a hero rich before the story started.
  it('chest pouches are pocket money, never a windfall', () => {
    expect(chestGoldAmount(20)).toBe(4)
    expect(chestGoldAmount(15)).toBe(4)
    expect(chestGoldAmount(1)).toBe(2)
    const dearestTier1 = Math.max(...SHOP_CATALOG.filter(i => i.tier === 1).map(i => i.price))
    expect(chestGoldAmount(20)).toBeLessThanOrEqual(dearestTier1 + 1)
  })

  it('found loot has fallback names for all five slots and a generic look', () => {
    for (const slot of ALL_SLOTS) {
      expect(fallbackLootName(slot, 'magic', 'da')).toBeTruthy()
      expect(createLoot(slot, 'magic', 1, 'x').look).toBeTruthy()
    }
  })
})
