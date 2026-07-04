import type { SceneFit, Difficulty, OutcomeType, CritType } from '@/types/game'

// --- d20 resolution, D&D style ---
// Roll a d20, add your stat bonus, beat the Difficulty Class (DC).
// Within PARTIAL_BAND below the DC = partial success.
// Natural 20 always crits, natural 1 always fumbles.

const DC_BASE: Record<Difficulty, number> = {
  easy: 10,
  medium: 12,
  hard: 14,
}

// Smart choices lower the bar, risky ones raise it
const SCENE_FIT_DC: Record<SceneFit, number> = {
  good: -2,
  okay: 0,
  risky: 2,
}

export const PARTIAL_BAND = 4

export interface DCInput {
  difficulty: Difficulty
  sceneFit: SceneFit
  // Heroes get stronger every level, so the DC climbs with them — numbers
  // grow (which feels great) while the odds stay balanced.
  level: number
  encounterActive: boolean
}

export function calculateDC(input: DCInput): number {
  return (
    DC_BASE[input.difficulty] +
    SCENE_FIT_DC[input.sceneFit] +
    (input.level - 1) +
    (input.encounterActive ? 1 : 0)
  )
}

export interface RollResolution {
  outcome: OutcomeType
  crit: CritType
  total: number
  dc: number
}

export function resolveD20(roll: number, statValue: number, dc: number): RollResolution {
  if (roll === 20) return { outcome: 'success', crit: 'crit', total: roll + statValue, dc }
  if (roll === 1) return { outcome: 'failure', crit: 'fumble', total: roll + statValue, dc }

  const total = roll + statValue
  let outcome: OutcomeType
  if (total >= dc) outcome = 'success'
  else if (total >= dc - PARTIAL_BAND) outcome = 'partial'
  else outcome = 'failure'
  return { outcome, crit: null, total, dc }
}

// What the kid needs to roll — shown BEFORE the dice hit the table.
// Clamped to 2..20 because a natural 1 always fumbles and 20 always crits.
export interface RequiredRolls {
  success: number
  partial: number
}

export function requiredRolls(dc: number, statValue: number): RequiredRolls {
  const clamp = (n: number) => Math.max(2, Math.min(20, n))
  return {
    success: clamp(dc - statValue),
    partial: clamp(dc - PARTIAL_BAND - statValue),
  }
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}
