'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sfx } from '@/lib/sound'
import { t, statLabel } from '@/lib/i18n'
import { rollD20, type RequiredRolls } from '@/lib/game/mechanics'
import type { Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

// Extra bonuses riding on this roll (determination, a helping friend, a
// luck potion) — each shown as its own chip so kids see where help comes from
export interface RollBoost {
  emoji: string
  label: string
  value: number
}

interface DiceRollerProps {
  stat: Stat
  statBonus: number
  // What to beat — shown BEFORE rolling so kids know exactly what they need
  required: RequiredRolls
  boosts?: RollBoost[]
  dicePreference: 'physical' | 'digital'
  // Physical mode needs a real d20 on the table; otherwise we roll digitally
  hasD20: boolean
  language: Language
  onRoll: (result: number) => void
}

export function DiceRoller({ stat, statBonus, required, boosts = [], dicePreference, hasD20, language, onRoll }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  const usePhysical = dicePreference === 'physical' && hasD20

  const handleDigitalRoll = () => {
    setIsRolling(true)
    sfx.diceRoll()
    let count = 0
    const interval = setInterval(() => {
      setResult(rollD20())
      count++
      if (count > 10) {
        clearInterval(interval)
        const finalResult = rollD20()
        setResult(finalResult)
        setIsRolling(false)
        setTimeout(() => onRoll(finalResult), 500)
      }
    }, 100)
  }

  const handlePhysicalPick = (value: number) => {
    if (result !== null) return
    setResult(value)
    onRoll(value)
  }

  // Color hint per face: what would this roll mean?
  const faceTone = (value: number) =>
    value >= required.success ? 'text-success' : value >= required.partial ? 'text-primary' : 'text-muted-foreground'

  return (
    <div className="bg-card rounded-lg p-6 border border-border space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          {statEmoji[stat]} {statLabel(stat, language)}
          <span className="ml-1 font-bold text-primary">+{statBonus}</span>
        </p>
        {boosts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {boosts.map((boost, i) => (
              <span
                key={i}
                className="rounded-full bg-success/10 text-success px-2.5 py-0.5 text-xs font-medium"
              >
                {boost.emoji} {boost.label} +{boost.value}
              </span>
            ))}
          </div>
        )}
        {/* The target, up front: no more guessing what the roll means */}
        <div className="flex justify-center gap-2 text-sm font-medium">
          <span className="rounded-full bg-success/15 text-success px-3 py-1">
            🎯 {t('rollToSucceed', language)} {required.success}+
          </span>
          {required.partial < required.success && (
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
              ⚡ {required.partial}+
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className={cn(
          "w-24 h-24 rounded-xl bg-muted flex items-center justify-center relative",
          "text-4xl font-bold text-foreground",
          isRolling && "animate-bounce"
        )}>
          {result ?? '?'}
          <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground font-normal">d20</span>
        </div>
      </div>

      {!usePhysical ? (
        <Button className="w-full" size="lg" onClick={handleDigitalRoll} disabled={isRolling || result !== null}>
          {isRolling ? '...' : result ? '✓' : '🎲 d20'}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">🎲 {t('tapYourRoll', language)}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                disabled={result !== null}
                onClick={() => handlePhysicalPick(value)}
                className={cn(
                  "h-11 text-base font-bold",
                  faceTone(value),
                  result === value && "border-primary ring-2 ring-primary/30 bg-primary/10"
                )}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
