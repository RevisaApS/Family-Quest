import { describe, it, expect } from 'vitest'
import {
  turnStatsForPlayer, playerHallStats, defeatedVillains,
  type CompletedAdventure,
} from '@/lib/game/chronicle'
import { calculateDC, YOUNG_HERO_AGE, YOUNG_HERO_DC_RELIEF } from '@/lib/game/mechanics'
import { toPet, PET_CATALOG } from '@/lib/game/pets'
import type { TurnRecord } from '@/types/game'

const turn = (playerId: string, outcome: TurnRecord['outcome'], diceRoll: number): TurnRecord => ({
  playerId, actionChosen: 'a', stat: 'strength', sceneFit: 'okay',
  diceRoll, outcome, narrativeResult: '',
})

const record = (overrides: Partial<CompletedAdventure>): CompletedAdventure => ({
  id: overrides.id ?? 'r1',
  completedAt: 1,
  questTitle: 'Quest',
  questGoal: 'Goal',
  villain: 'Skyggekongen',
  style: 'realistic',
  heroes: [],
  ...overrides,
})

describe('turn stats', () => {
  it('counts only the player\'s own turns, deriving crits/fumbles from the d20', () => {
    const history = [
      turn('p1', 'success', 20),
      turn('p1', 'failure', 1),
      turn('p1', 'partial', 10),
      turn('p2', 'success', 20),
    ]
    const stats = turnStatsForPlayer(history, 'p1')
    expect(stats).toEqual({ turns: 3, successes: 1, crits: 1, fumbles: 1 })
  })
})

describe('hall of heroes aggregation', () => {
  const chronicle: CompletedAdventure[] = [
    record({
      id: 'r1', questTitle: 'First Quest', villain: 'Troldkongen',
      heroes: [
        { playerId: 'p1', playerName: 'Anna', characterName: 'Astrid', class: 'warrior', level: 4, turns: 5, successes: 3, crits: 1, fumbles: 0, award: { title: 'Legendary Strike', reason: 'r' } },
      ],
    }),
    record({
      id: 'r2', questTitle: 'Second Quest', villain: 'Skyggekongen',
      heroes: [
        { playerId: 'p1', playerName: 'Anna', characterName: 'Astrid', class: 'warrior', level: 5, turns: 6, successes: 4, crits: 2, fumbles: 1 },
        { playerId: 'p2', playerName: 'Bo', characterName: 'Birk', class: 'ranger', level: 3, turns: 6, successes: 2, crits: 0, fumbles: 2, award: { title: 'Bravest Heart', reason: 'r' } },
      ],
    }),
  ]

  it('sums a player\'s lifetime stats and collects their awards', () => {
    const anna = playerHallStats(chronicle, 'p1')
    expect(anna.adventures).toBe(2)
    expect(anna.crits).toBe(3)
    expect(anna.successes).toBe(7)
    expect(anna.awards).toEqual([{ title: 'Legendary Strike', reason: 'r', questTitle: 'First Quest' }])
    // Bo only joined the second quest
    expect(playerHallStats(chronicle, 'p2').adventures).toBe(1)
    expect(playerHallStats(chronicle, 'p3').adventures).toBe(0)
  })

  it('lists every defeated villain', () => {
    const villains = defeatedVillains(chronicle)
    expect(villains.map(v => v.villain)).toEqual(['Troldkongen', 'Skyggekongen'])
    expect(defeatedVillains([record({ villain: undefined })])).toHaveLength(0)
  })
})

describe('young hero DC relief', () => {
  const base = {
    difficulty: 'medium' as const, sceneFit: 'okay' as const,
    level: 1, encounterActive: false, milestonesDone: 0,
  }

  it('gives kids under the threshold an invisible break', () => {
    expect(calculateDC({ ...base, age: YOUNG_HERO_AGE - 1 })).toBe(calculateDC(base) - YOUNG_HERO_DC_RELIEF)
  })

  it('changes nothing for everyone else', () => {
    expect(calculateDC({ ...base, age: YOUNG_HERO_AGE })).toBe(calculateDC(base))
    expect(calculateDC({ ...base, age: 35 })).toBe(calculateDC(base))
    expect(calculateDC(base)).toBe(14)
  })
})

describe('pet naming', () => {
  it('uses the kid\'s chosen name, falling back to the catalog', () => {
    expect(toPet(PET_CATALOG[0], 'en', 'Fluffy').name).toBe('Fluffy')
    expect(toPet(PET_CATALOG[0], 'en', '   ').name).toBe(PET_CATALOG[0].name.en)
    expect(toPet(PET_CATALOG[0], 'da').name).toBe(PET_CATALOG[0].name.da)
  })
})
