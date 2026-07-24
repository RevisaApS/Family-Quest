import { describe, it, expect } from 'vitest'
import {
  VALUE_THEMES, ACT_COUNT, nextTheme, themeById, actIndex,
  phaseAllowsDilemma, shouldPlantDilemma,
} from '@/lib/game/values'

describe('the four themes', () => {
  it('has exactly four themes with unique ids and both languages', () => {
    expect(VALUE_THEMES).toHaveLength(4)
    expect(new Set(VALUE_THEMES.map(t => t.id)).size).toBe(4)
    for (const theme of VALUE_THEMES) {
      expect(theme.da.length).toBeGreaterThan(10)
      expect(theme.en.length).toBeGreaterThan(10)
      expect(theme.antiVirtue.length).toBeGreaterThan(10)
      expect(theme.dilemmaGuidance.length).toBeGreaterThan(10)
    }
  })

  it('themeById finds a theme and shrugs at junk', () => {
    expect(themeById('hard-first')?.id).toBe('hard-first')
    expect(themeById(undefined)).toBeUndefined()
    expect(themeById(null)).toBeUndefined()
    expect(themeById('patience')).toBeUndefined()
  })
})

describe('nextTheme rotation', () => {
  it('cycles all four ideas before repeating any', () => {
    const firstFour = [0, 1, 2, 3].map(i => nextTheme(i).id)
    expect(new Set(firstFour).size).toBe(4)
    expect(firstFour).toEqual(VALUE_THEMES.map(t => t.id))
  })

  it('wraps around to the first idea on the fifth adventure', () => {
    expect(nextTheme(4).id).toBe(nextTheme(0).id)
    expect(nextTheme(9).id).toBe(nextTheme(1).id)
  })

  it('is stable for the same pointer — a reload picks the same idea', () => {
    expect(nextTheme(2).id).toBe(nextTheme(2).id)
    expect(nextTheme(2)).toBe(nextTheme(2))
  })

  it("the grown-up's override always wins, whatever the pointer says", () => {
    expect(nextTheme(0, 'others-anger').id).toBe('others-anger')
    expect(nextTheme(3, 'control').id).toBe('control')
  })

  it('falls back to the rotation when the override is empty or unknown', () => {
    expect(nextTheme(1, null).id).toBe(nextTheme(1).id)
    expect(nextTheme(1, undefined).id).toBe(nextTheme(1).id)
    // A stale id from an older build must not blank out the theme
    expect(nextTheme(1, 'kindness' as never).id).toBe(nextTheme(1).id)
  })

  it('survives a junk pointer without crashing the adventure', () => {
    expect(nextTheme(-1).id).toBe(VALUE_THEMES[3].id)
    expect(nextTheme(NaN).id).toBe(VALUE_THEMES[0].id)
    expect(nextTheme(2.7).id).toBe(VALUE_THEMES[2].id)
  })
})

describe('actIndex', () => {
  it('maps milestones to the three acts and clamps', () => {
    expect(actIndex(0)).toBe(0)
    expect(actIndex(1)).toBe(1)
    expect(actIndex(2)).toBe(2)
    expect(actIndex(3)).toBe(ACT_COUNT - 1)
    expect(actIndex(-4)).toBe(0)
  })
})

describe('phaseAllowsDilemma', () => {
  it('allows quiet scenes only — battle forces all 3 actions to be attacks', () => {
    expect(phaseAllowsDilemma(undefined)).toBe(true)
    expect(phaseAllowsDilemma('none')).toBe(true)
    expect(phaseAllowsDilemma('just-defeated')).toBe(true)
    expect(phaseAllowsDilemma('active')).toBe(false)
    expect(phaseAllowsDilemma('arriving-monster')).toBe(false)
    expect(phaseAllowsDilemma('arriving-boss')).toBe(false)
    // Anything unrecognised is treated as unsafe rather than sneaking through
    expect(phaseAllowsDilemma('something-new')).toBe(false)
  })
})

describe('dilemma scheduling: one per act, never in a fight', () => {
  const base = { milestonesDone: 0, lastDilemmaAct: null, hasTheme: true }

  it('plants one in an act that has not had one yet', () => {
    expect(shouldPlantDilemma(base)).toBe(true)
  })

  it('plants at most one per act', () => {
    expect(shouldPlantDilemma({ ...base, lastDilemmaAct: 0 })).toBe(false)
    expect(shouldPlantDilemma({ ...base, milestonesDone: 1, lastDilemmaAct: 0 })).toBe(true)
    expect(shouldPlantDilemma({ ...base, milestonesDone: 1, lastDilemmaAct: 1 })).toBe(false)
    expect(shouldPlantDilemma({ ...base, milestonesDone: 2, lastDilemmaAct: 1 })).toBe(true)
    expect(shouldPlantDilemma({ ...base, milestonesDone: 2, lastDilemmaAct: 2 })).toBe(false)
  })

  it('never plants during an encounter', () => {
    for (const phase of ['active', 'arriving-monster', 'arriving-boss']) {
      expect(shouldPlantDilemma({ ...base, encounterPhase: phase })).toBe(false)
    }
    expect(shouldPlantDilemma({ ...base, encounterPhase: 'none' })).toBe(true)
    expect(shouldPlantDilemma({ ...base, encounterPhase: 'just-defeated' })).toBe(true)
  })

  it('leaves the opening scene alone — it is already inventing the quest', () => {
    expect(shouldPlantDilemma({ ...base, isFirstScene: true })).toBe(false)
  })

  it('plants nothing when the adventure has no theme (a pre-v7 save)', () => {
    expect(shouldPlantDilemma({ ...base, hasTheme: false })).toBe(false)
    expect(shouldPlantDilemma({ milestonesDone: 0, lastDilemmaAct: null })).toBe(false)
  })

  it('stops once the quest is finished', () => {
    expect(shouldPlantDilemma({ ...base, milestonesDone: 3, lastDilemmaAct: 1 })).toBe(false)
  })

  it('walks a whole three-act quest to exactly three dilemmas', () => {
    let lastDilemmaAct: number | null = null
    let planted = 0
    // A plausible arc: quiet scenes, a monster fight, quiet scenes, a fight,
    // quiet scenes, the boss. Milestones tick up as encounters fall.
    const arc: Array<{ milestonesDone: number; encounterPhase: string; isFirstScene?: boolean }> = [
      { milestonesDone: 0, encounterPhase: 'none', isFirstScene: true },
      { milestonesDone: 0, encounterPhase: 'none' },
      { milestonesDone: 0, encounterPhase: 'none' },
      { milestonesDone: 0, encounterPhase: 'arriving-monster' },
      { milestonesDone: 0, encounterPhase: 'active' },
      { milestonesDone: 1, encounterPhase: 'just-defeated' },
      { milestonesDone: 1, encounterPhase: 'none' },
      { milestonesDone: 1, encounterPhase: 'arriving-monster' },
      { milestonesDone: 1, encounterPhase: 'active' },
      { milestonesDone: 2, encounterPhase: 'just-defeated' },
      { milestonesDone: 2, encounterPhase: 'none' },
      { milestonesDone: 2, encounterPhase: 'arriving-boss' },
      { milestonesDone: 2, encounterPhase: 'active' },
      { milestonesDone: 3, encounterPhase: 'just-defeated' },
    ]
    for (const scene of arc) {
      if (shouldPlantDilemma({ ...scene, lastDilemmaAct, hasTheme: true })) {
        planted += 1
        lastDilemmaAct = actIndex(scene.milestonesDone)
      }
    }
    expect(planted).toBe(3)
    expect(lastDilemmaAct).toBe(2)
  })
})
