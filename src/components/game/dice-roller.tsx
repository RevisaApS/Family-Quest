'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

interface DiceRollerProps {
  stat: Stat
  dicePreference: 'physical' | 'digital'
  onRoll: (result: number) => void
}

export function DiceRoller({ stat, dicePreference, onRoll }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  const handleDigitalRoll = () => {
    setIsRolling(true)
    let count = 0
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 10) {
        clearInterval(interval)
        const finalResult = Math.floor(Math.random() * 6) + 1
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

  return (
    <div className="bg-card rounded-lg p-6 border border-border space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          This tests your {statEmoji[stat]} {stat.charAt(0).toUpperCase() + stat.slice(1)}
        </p>
        <p className="text-lg font-medium">Roll and see what happens!</p>
      </div>

      <div className="flex justify-center">
        <div className={cn(
          "w-24 h-24 rounded-xl bg-muted flex items-center justify-center",
          "text-5xl font-bold text-foreground",
          isRolling && "animate-bounce"
        )}>
          {result ?? '?'}
        </div>
      </div>

      {dicePreference === 'digital' ? (
        <Button className="w-full" size="lg" onClick={handleDigitalRoll} disabled={isRolling || result !== null}>
          {isRolling ? 'Rolling...' : result ? 'Rolled!' : '🎲 Tap to Roll'}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">🎲 Roll your dice, then tap the number you rolled:</p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3, 4, 5, 6] as const).map((value) => (
              <Button
                key={value}
                variant="outline"
                disabled={result !== null}
                onClick={() => handlePhysicalPick(value)}
                className={cn(
                  "h-16 text-3xl font-bold",
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
