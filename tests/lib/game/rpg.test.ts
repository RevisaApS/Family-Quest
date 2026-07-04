import { describe, it, expect } from 'vitest'
import {
  levelForXp, xpForNextLevel, maxHpForLevel, heroDamageForOutcome,
  bossDamageForOutcome, rescueHp, heroStatBonus, levelThresholdAdjustment,
  lootShouldDrop, lootBonusForRoll, bossArrivalTurn, bossMaxHp, createBoss,
  createHero, applyTurnOutcome, reviveHero, equipLoot, addSkill,
  BASE_MAX_HP, MAX_LEVEL,
} from '@/lib/game/rpg'
import { skillChoices } from '@/lib/game/skills'
import { fallbackLootName, createLoot } from '@/lib/game/loot'
import { colorNameFromHsl, heroVisualDescription } from '@/lib/game/appearance'
import { calculateOutcome } from '@/lib/game/mechanics'
import type { LootItem, Skill } from '@/types/game'

const sword: LootItem = { id: 'l1', slot: 'weapon', name: 'Flame Sword', emoji: '⚔️', stat: 'strength', bonus: 2 }
const skill: Skill = { id: 's1', name: 'Shield Bash', emoji: '🛡️', stat: 'strength', bonus: 1, description: '' }

describe('levels & xp', () => {
  it('starts at level 1 and reaches level 2 at 6 xp', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(5)).toBe(1)
    expect(levelForXp(6)).toBe(2)
  })

  it('caps at MAX_LEVEL', () => {
    expect(levelForXp(999)).toBe(MAX_LEVEL)
    expect(xpForNextLevel(MAX_LEVEL)).toBeNull()
  })

  it('levels are monotonically increasing in xp', () => {
    let last = 1
    for (let xp = 0; xp <= 50; xp++) {
      const level = levelForXp(xp)
      expect(level).toBeGreaterThanOrEqual(last)
      last = level
    }
  })

  it('max hp grows with level', () => {
    expect(maxHpForLevel(1)).toBe(BASE_MAX_HP)
    expect(maxHpForLevel(3)).toBe(BASE_MAX_HP + 2)
  })
})

describe('damage', () => {
  it('failure hurts, success never does', () => {
    expect(heroDamageForOutcome('failure', false)).toBe(1)
    expect(heroDamageForOutcome('partial', false)).toBe(0)
    expect(heroDamageForOutcome('success', false)).toBe(0)
  })

  it('boss fights hit harder', () => {
    expect(heroDamageForOutcome('failure', true)).toBe(2)
    expect(heroDamageForOutcome('partial', true)).toBe(1)
  })

  it('heroes damage the boss on success and partial', () => {
    expect(bossDamageForOutcome('success')).toBe(2)
    expect(bossDamageForOutcome('partial')).toBe(1)
    expect(bossDamageForOutcome('failure')).toBe(0)
  })
})

describe('hero stat bonus', () => {
  it('combines class stats, skills, and equipped loot', () => {
    const hero = { skills: [skill], equipment: { weapon: sword } }
    // warrior strength base is 5
    expect(heroStatBonus('warrior', hero, 'strength')).toBe(5 + 1 + 2)
    // unrelated stat gets no bonus (warrior magic base is 1)
    expect(heroStatBonus('warrior', hero, 'magic')).toBe(1)
  })
})

describe('threshold scaling', () => {
  it('raises thresholds by level - 1', () => {
    expect(levelThresholdAdjustment(1)).toBe(0)
    expect(levelThresholdAdjustment(4)).toBe(3)
  })

  it('flows through calculateOutcome', () => {
    const base = calculateOutcome({ sceneFit: 'okay', statValue: 4, diceRoll: 4, difficulty: 'medium' })
    expect(base.outcome).toBe('success') // 9 vs 9
    const scaled = calculateOutcome({ sceneFit: 'okay', statValue: 4, diceRoll: 4, difficulty: 'medium', thresholdAdjustment: 2 })
    expect(scaled.outcome).toBe('partial') // 9 vs 11/9
  })
})

describe('loot', () => {
  it('drops on strong successes only', () => {
    expect(lootShouldDrop('success', 6)).toBe(true)
    expect(lootShouldDrop('success', 4)).toBe(true)
    expect(lootShouldDrop('success', 3)).toBe(false)
    expect(lootShouldDrop('partial', 6)).toBe(false)
    expect(lootShouldDrop('failure', 6)).toBe(false)
  })

  it('a six means rare loot', () => {
    expect(lootBonusForRoll(6)).toBe(2)
    expect(lootBonusForRoll(4)).toBe(1)
  })

  it('has fallback names in both languages for every slot/stat', () => {
    for (const slot of ['weapon', 'armor', 'trinket'] as const) {
      for (const stat of ['strength', 'magic', 'agility', 'heart'] as const) {
        expect(fallbackLootName(slot, stat, 'da')).toBeTruthy()
        expect(fallbackLootName(slot, stat, 'en')).toBeTruthy()
      }
    }
  })

  it('createLoot fills slot emoji', () => {
    const item = createLoot('armor', 'magic', 1, 'Cloak of Stars')
    expect(item.emoji).toBe('🛡️')
    expect(item.slot).toBe('armor')
  })
})

describe('boss', () => {
  it('arrives after every hero has had their turns', () => {
    expect(bossArrivalTurn(3)).toBe(12)
  })

  it('scales hp with party size', () => {
    expect(bossMaxHp(1)).toBe(5)
    expect(bossMaxHp(3)).toBe(11)
    const boss = createBoss('Skyggekongen', 2)
    expect(boss.hp).toBe(boss.maxHp)
    expect(boss.defeated).toBe(false)
  })
})

describe('turn resolution', () => {
  it('awards xp and applies damage', () => {
    const hero = createHero('p1')
    const { hero: after, xpGained, damageTaken } = applyTurnOutcome(hero, 'failure', false)
    expect(xpGained).toBe(1)
    expect(damageTaken).toBe(1)
    expect(after.hp).toBe(BASE_MAX_HP - 1)
    expect(after.knockedOut).toBe(false)
  })

  it('knocks out at 0 hp and revives at half max hp', () => {
    const hero = { ...createHero('p1'), hp: 2 }
    const { hero: after } = applyTurnOutcome(hero, 'failure', true)
    expect(after.hp).toBe(0)
    expect(after.knockedOut).toBe(true)
    const revived = reviveHero(after)
    expect(revived.knockedOut).toBe(false)
    expect(revived.hp).toBe(rescueHp(after.maxHp))
  })

  it('level up raises max hp and fully heals', () => {
    const hero = { ...createHero('p1'), xp: 5, hp: 1 }
    const { hero: after, leveledUp } = applyTurnOutcome(hero, 'success', false)
    expect(leveledUp).toBe(true)
    expect(after.level).toBe(2)
    expect(after.maxHp).toBe(maxHpForLevel(2))
    expect(after.hp).toBe(after.maxHp)
    expect(after.knockedOut).toBe(false)
  })

  it('equip and skills are idempotent-safe', () => {
    let hero = createHero('p1')
    hero = equipLoot(hero, sword)
    expect(hero.equipment.weapon?.name).toBe('Flame Sword')
    hero = addSkill(hero, skill)
    hero = addSkill(hero, skill)
    expect(hero.skills).toHaveLength(1)
  })
})

describe('skill choices', () => {
  it('offers 3 unowned skills per class in the chosen language', () => {
    const choices = skillChoices('warrior', [], 'da')
    expect(choices).toHaveLength(3)
    expect(choices[0].name).toBe('Skjoldbrag')
    const later = skillChoices('warrior', choices.map(c => c.id), 'en')
    expect(later.length).toBeGreaterThan(0)
    expect(later.every(c => !choices.some(o => o.id === c.id))).toBe(true)
  })
})

describe('appearance', () => {
  it('maps hsl hues to color words', () => {
    expect(colorNameFromHsl('hsl(0, 70%, 50%)')).toBe('red')
    expect(colorNameFromHsl('hsl(120.5, 70%, 50%)')).toBe('green')
    expect(colorNameFromHsl('not-a-color')).toBe('blue')
  })

  it('builds a stable hero description', () => {
    const desc = heroVisualDescription('Freja', 'warrior', 'female', 'hsl(210, 70%, 50%)')
    expect(desc).toContain('Freja')
    expect(desc).toContain('girl')
    expect(desc).toContain('knight')
    expect(desc).toContain('blue cape')
  })
})
