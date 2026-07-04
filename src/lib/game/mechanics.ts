import type { SceneFit, Difficulty, OutcomeType } from '@/types/game'

const SCENE_FIT_BONUS: Record<SceneFit, number> = { good: 2, okay: 1, risky: 0 }

const DIFFICULTY_THRESHOLDS: Record<Difficulty, { success: number; partial: number }> = {
  easy: { success: 8, partial: 6 },
  medium: { success: 9, partial: 7 },
  hard: { success: 10, partial: 8 },
}

export interface SuccessCalculation {
  sceneFit: SceneFit
  statValue: number
  diceRoll: number
  difficulty: Difficulty
  // Raises both thresholds as heroes level up (and during boss fights) so
  // growing stat bonuses keep the same odds instead of trivializing rolls.
  thresholdAdjustment?: number
}

export interface OutcomeResult {
  outcome: OutcomeType
  combinedScore: number
  threshold: { success: number; partial: number }
}

export function calculateSceneFitBonus(sceneFit: SceneFit): number {
  return SCENE_FIT_BONUS[sceneFit]
}

export function calculateThreshold(difficulty: Difficulty): { success: number; partial: number } {
  return DIFFICULTY_THRESHOLDS[difficulty]
}

export function calculateOutcome(calc: SuccessCalculation): OutcomeResult {
  const sceneFitBonus = calculateSceneFitBonus(calc.sceneFit)
  const combinedScore = sceneFitBonus + calc.statValue + calc.diceRoll
  const base = calculateThreshold(calc.difficulty)
  const adjustment = calc.thresholdAdjustment ?? 0
  const threshold = { success: base.success + adjustment, partial: base.partial + adjustment }

  let outcome: OutcomeType
  if (combinedScore >= threshold.success) outcome = 'success'
  else if (combinedScore >= threshold.partial) outcome = 'partial'
  else outcome = 'failure'

  return { outcome, combinedScore, threshold }
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}
