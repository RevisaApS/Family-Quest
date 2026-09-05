'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/ai/language'
import { isGuessRight, type RollGuess } from '@/lib/game/prediction'

export interface Spectator {
  playerId: string
  name: string
}

interface RollGuessProps {
  spectators: Spectator[]
  guesses: Record<string, RollGuess>
  onGuess: (playerId: string, guess: RollGuess | null) => void
  language: Language
}

// Shown to the kid who is NOT rolling, in the dice phase: two big buttons.
// Tapping the chosen one again takes the guess back.
export function RollGuess({ spectators, guesses, onGuess, language }: RollGuessProps) {
  if (spectators.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3" data-testid="roll-guess">
      {spectators.map(s => {
        const picked = guesses[s.playerId]
        return (
          <div key={s.playerId} className="space-y-2">
            <p className="text-center text-sm">
              🔮 <span className="font-medium">{s.name}</span>, {t('guessPrompt', language)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['high', 'low'] as RollGuess[]).map(g => (
                <button
                  key={g}
                  onClick={() => onGuess(s.playerId, picked === g ? null : g)}
                  className={cn(
                    'min-h-[44px] rounded-lg border px-3 py-2 text-base font-medium transition-all active:scale-95',
                    picked === g
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-foreground'
                  )}
                >
                  {g === 'high' ? '⬆️ ' : '⬇️ '}{t(g === 'high' ? 'guessHigh' : 'guessLow', language)}
                  {picked === g && ' ✓'}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface GuessResultsProps {
  spectators: Spectator[]
  guesses: Record<string, RollGuess>
  streaks: Record<string, number>
  roll: number
  language: Language
}

// After the roll: one cheer line per kid who guessed. The streak shown is
// what it WILL be once this turn is recorded, so a right guess reads "×3".
export function GuessResults({ spectators, guesses, streaks, roll, language }: GuessResultsProps) {
  const lines = spectators
    .filter(s => guesses[s.playerId])
    .map(s => {
      const right = isGuessRight(guesses[s.playerId], roll)
      const streak = right ? (streaks[s.playerId] ?? 0) + 1 : 0
      return { ...s, right, streak }
    })
  if (lines.length === 0) return null
  return (
    <div className="space-y-1.5" data-testid="guess-results">
      {lines.map(l => (
        <motion.p
          key={l.playerId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={cn(
            'rounded-lg border px-3 py-2 text-center text-sm',
            l.right ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-card text-muted-foreground'
          )}
        >
          🔮 <span className="font-medium">{l.name}</span>{' '}
          {l.right ? t('guessRight', language) : t('guessMiss', language)}
          {l.right && l.streak >= 2 && ` ${t('guessStreak', language)} ×${l.streak}`}
        </motion.p>
      ))}
    </div>
  )
}
