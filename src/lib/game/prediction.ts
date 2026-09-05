// The off-turn kid's game: before the d20 lands, guess whether it comes up
// high or low. Pure chance, deliberately — the point is to give the sibling
// who isn't rolling a stake in every roll, not a skill to master. The reward
// is a cheer and a streak, never gold or XP, so the economy the balance
// simulator tuned is untouched.

export type RollGuess = 'high' | 'low'

// 1–10 is low, 11–20 is high: no ties on a d20.
export const HIGH_FROM = 11

export function guessForRoll(roll: number): RollGuess {
  return roll >= HIGH_FROM ? 'high' : 'low'
}

export function isGuessRight(guess: RollGuess, roll: number): boolean {
  return guessForRoll(roll) === guess
}

// A right guess extends the streak; a wrong one resets it. No guess leaves it.
export function nextGuessStreak(streak: number, guess: RollGuess | undefined, roll: number): number {
  if (!guess) return streak
  return isGuessRight(guess, roll) ? streak + 1 : 0
}
