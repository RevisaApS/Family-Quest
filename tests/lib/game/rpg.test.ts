import { describe, it, expect } from 'vitest'
import {
  levelForXp, xpForNextLevel, maxHpForLevel, heroDamageForOutcome,
  encounterDamageForOutcome, rescueHp, heroStatBonus,
  lootShouldDrop, lootBonusForRoll, encounterSpawnTurn, nextEncounterKind,
  encounterMaxHp, createEncounter, createHero, applyTurnOutcome, reviveHero,
  equipLoot, addSkill, canUsePower, usePower, healHero,
  BASE_MAX_HP, MAX_LEVEL, QUEST_MILESTONES, MIN_HP, FUMBLE_RETALIATION_DAMAGE,
} from '@/lib/game/rpg'
import { skillChoices } from '@/lib/game/skills'
import { fallbackLootName, createLoot } from '@/lib/game/loot'
import { colorNameFromHsl, heroVisualDescription } from '@/lib/game/appearance'
import type { LootItem, Skill } from '@/types/game'

const sword: LootItem = { id: 'l1', slot: 'weapon', name: 'Flame Sword', emoji: '⚔️', stat: 'strength', bonus: 2 }
const skill: Skill = {
  id: 's1', name: 'Skjoldvagt', emoji: '🛡️', stat: 'strength', bonus: 1,
  description: '', power: 'shield', powerName: 'Skjold',
}

describe('levels & xp', () => {
  it('starts at level 1 and reaches level 2 at 4 xp', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(3)).toBe(1)
    expect(levelForXp(4)).toBe(2)
  })

  it('caps at MAX_LEVEL', () => {
    expect(levelForXp(999)).toBe(MAX_LEVEL)
    expect(xpForNextLevel(MAX_LEVEL)).toBeNull()
  })

  // A quest runs ~23 turns, so each hero acts ~7-8 times at ~2.3 xp a turn.
  // The curve has to fit inside that or the top levels are content nobody sees.
  it('is reachable inside one adventure — max level by roughly 8 turns each', () => {
    const xpAfterEightAverageTurns = Math.round(8 * 2.3)
    expect(levelForXp(xpAfterEightAverageTurns)).toBe(MAX_LEVEL)
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

  it('battles hit harder', () => {
    expect(heroDamageForOutcome('failure', true)).toBe(3)
    expect(heroDamageForOutcome('partial', true)).toBe(1)
  })

  it('a natural 1 in a fight lets the monster strike back', () => {
    expect(heroDamageForOutcome('failure', true, 'fumble'))
      .toBe(3 + FUMBLE_RETALIATION_DAMAGE)
    // outside a fight a fumble is pure comedy, no free swing
    expect(heroDamageForOutcome('failure', false, 'fumble')).toBe(1)
  })

  it('heroes damage the enemy on success/partial, crits hit double', () => {
    expect(encounterDamageForOutcome('success', null)).toBe(2)
    expect(encounterDamageForOutcome('partial', null)).toBe(1)
    expect(encounterDamageForOutcome('failure', null)).toBe(0)
    expect(encounterDamageForOutcome('success', 'crit')).toBe(4)
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

describe('loot (d20 scale)', () => {
  it('drops on crits and strong successes only', () => {
    expect(lootShouldDrop('success', 20, 'crit')).toBe(true)
    expect(lootShouldDrop('failure', 20, 'crit')).toBe(true) // nat 20 is never a failure, but crit always drops
    expect(lootShouldDrop('success', 15, null)).toBe(true)
    expect(lootShouldDrop('success', 14, null)).toBe(false)
    expect(lootShouldDrop('partial', 19, null)).toBe(false)
  })

  it('18+ means rare loot', () => {
    expect(lootBonusForRoll(18)).toBe(2)
    expect(lootBonusForRoll(15)).toBe(1)
  })

  it('has fallback names in both languages for every slot/stat', () => {
    for (const slot of ['weapon', 'armor', 'helmet', 'trinket', 'boots'] as const) {
      for (const stat of ['strength', 'magic', 'agility', 'heart'] as const) {
        expect(fallbackLootName(slot, stat, 'da')).toBeTruthy()
        expect(fallbackLootName(slot, stat, 'en')).toBeTruthy()
      }
    }
  })

  it('createLoot fills slot emoji and a look for images', () => {
    const item = createLoot('armor', 'magic', 1, 'Cloak of Stars')
    expect(item.emoji).toBe('🛡️')
    expect(item.look).toBeTruthy()
  })
})

describe('quest arc & encounters', () => {
  it('first monster once everyone has acted, mid-quest monster, then the boss', () => {
    expect(encounterSpawnTurn(0, 1)).toBe(2) // solo hero still gets 2 story turns first
    expect(encounterSpawnTurn(0, 3)).toBe(3)
    expect(encounterSpawnTurn(1, 3)).toBe(9)
    expect(encounterSpawnTurn(2, 3)).toBe(15)
    expect(nextEncounterKind(0)).toBe('monster')
    expect(nextEncounterKind(1)).toBe('monster')
    expect(nextEncounterKind(2)).toBe('boss')
    expect(QUEST_MILESTONES).toBe(3)
  })

  it('the first monster is a quick win, the boss is the big fight', () => {
    expect(encounterMaxHp('monster', 0, 2)).toBe(5)
    expect(encounterMaxHp('monster', 1, 2)).toBe(6)
    expect(encounterMaxHp('boss', 2, 2)).toBe(8)
    const boss = createEncounter('boss', 'Skyggekongen', 2, 2)
    expect(boss.hp).toBe(boss.maxHp)
    expect(boss.kind).toBe('boss')
    expect(boss.defeated).toBe(false)
  })
})

describe('turn resolution', () => {
  it('awards xp and gold, applies damage', () => {
    const hero = createHero('p1')
    const { hero: after, xpGained, goldGained, damageTaken } = applyTurnOutcome(hero, 'failure', false)
    expect(xpGained).toBe(1)
    expect(goldGained).toBe(0)
    expect(damageTaken).toBe(1)
    expect(after.hp).toBe(BASE_MAX_HP - 1)
  })

  it('crits pay bonus gold', () => {
    const { goldGained } = applyTurnOutcome(createHero('p1'), 'success', false, 'crit')
    expect(goldGained).toBe(3)
  })

  it('never knocks a hero out — HP floors at MIN_HP however bad the streak', () => {
    let hero = { ...createHero('p1'), hp: 2 }
    // a fumble in a fight is the hardest hit in the game
    hero = applyTurnOutcome(hero, 'failure', true, 'fumble').hero
    expect(hero.hp).toBe(MIN_HP)
    expect(hero.knockedOut).toBe(false)
    // and it still can't push them under
    hero = applyTurnOutcome(hero, 'failure', true, 'fumble').hero
    expect(hero.hp).toBe(MIN_HP)
    expect(hero.knockedOut).toBe(false)
  })

  it('rescuing a downed hero restores half their max hp', () => {
    const downed = { ...createHero('p1'), hp: 0, knockedOut: true }
    const revived = reviveHero(downed)
    expect(revived.knockedOut).toBe(false)
    expect(revived.hp).toBe(rescueHp(downed.maxHp))
  })

  it('level up raises max hp and gives a second wind, not a full heal', () => {
    const hero = { ...createHero('p1'), xp: 3, hp: 1 }
    const { hero: after, leveledUp } = applyTurnOutcome(hero, 'success', false)
    expect(leveledUp).toBe(true)
    expect(after.level).toBe(2)
    expect(after.hp).toBeGreaterThan(1)
    expect(after.hp).toBeLessThan(after.maxHp)
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

describe('once-per-adventure powers', () => {
  it('usable only when learned and not yet spent', () => {
    let hero = createHero('p1')
    expect(canUsePower(hero, 'shield')).toBe(false)
    hero = addSkill(hero, skill)
    expect(canUsePower(hero, 'shield')).toBe(true)
    hero = usePower(hero, 'shield')
    expect(canUsePower(hero, 'shield')).toBe(false)
    // spending twice is a no-op
    expect(usePower(hero, 'shield').usedPowers).toHaveLength(1)
  })

  it('healing never exceeds max hp and clears KO', () => {
    const hurt = { ...createHero('p1'), hp: 0, knockedOut: true }
    const healed = healHero(hurt, 3)
    expect(healed.hp).toBe(3)
    expect(healed.knockedOut).toBe(false)
    expect(healHero(createHero('p1'), 5).hp).toBe(BASE_MAX_HP)
  })
})

describe('skill choices (balanced)', () => {
  it('every choice is the same +1 — only stat and power differ', () => {
    const choices = skillChoices('warrior', [], 'da')
    expect(choices).toHaveLength(3)
    expect(choices.every(c => c.bonus === 1)).toBe(true)
    const powers = choices.map(c => c.power)
    expect(new Set(powers).size).toBe(powers.length)
  })

  it('uses everyday Danish — no "Behændighed"', () => {
    for (const cls of ['warrior', 'wizard', 'rogue', 'ranger'] as const) {
      const all = skillChoices(cls, [], 'da')
      for (const c of all) {
        expect(c.description).not.toContain('Behændighed')
        expect(c.description).not.toContain('Hjerte')
      }
    }
  })

  it('excludes owned skills', () => {
    const first = skillChoices('warrior', [], 'en')
    const later = skillChoices('warrior', first.map(c => c.id), 'en')
    expect(later.every(c => !first.some(o => o.id === c.id))).toBe(true)
  })
})

describe('appearance', () => {
  it('maps hsl hues to color words', () => {
    expect(colorNameFromHsl('hsl(0, 70%, 50%)')).toBe('red')
    expect(colorNameFromHsl('hsl(120.5, 70%, 50%)')).toBe('green')
    expect(colorNameFromHsl('not-a-color')).toBe('blue')
  })

  it('builds a stable hero description', () => {
    const desc = heroVisualDescription('Freja', 'warrior', 'female', 'hsl(210, 70%, 50%)', 9)
    expect(desc).toContain('Freja')
    expect(desc).toContain('young girl')
    expect(desc).toContain('warrior')
    expect(desc).toContain('blue cape')
    // Heroes own nothing until they buy or loot it — see appearance.test.ts
    expect(desc).toContain('carrying nothing at all')
  })

  it('keeps grown-ups grown up', () => {
    expect(heroVisualDescription('Steven', 'ranger', 'male', 'hsl(30, 70%, 50%)', 35)).toContain('adult man')
    expect(heroVisualDescription('Ida', 'rogue', 'female', 'hsl(30, 70%, 50%)', 15)).toContain('teenage girl')
    expect(heroVisualDescription('Bo', 'wizard', 'neutral', 'hsl(30, 70%, 50%)', 7)).toContain('young child')
  })
})
