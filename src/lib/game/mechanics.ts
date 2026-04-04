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
  const threshold = calculateThreshold(calc.difficulty)

  let outcome: OutcomeType
  if (combinedScore >= threshold.success) outcome = 'success'
  else if (combinedScore >= threshold.partial) outcome = 'partial'
  else outcome = 'failure'

  return { outcome, combinedScore, threshold }
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}
