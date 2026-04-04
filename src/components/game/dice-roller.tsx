'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [physicalInput, setPhysicalInput] = useState('')
  const [inputError, setInputError] = useState('')

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

  const handlePhysicalSubmit = () => {
    const value = parseInt(physicalInput)
    if (isNaN(value) || value < 1 || value > 6) {
      setInputError('Please enter 1-6')
      return
    }
    setInputError('')
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
          <p className="text-center text-sm text-muted-foreground">Roll your physical d6 and enter the result:</p>
          <div className="flex gap-2">
            <Input type="number" min="1" max="6" value={physicalInput} onChange={(e) => setPhysicalInput(e.target.value)} placeholder="1-6" className="text-center text-xl" />
            <Button onClick={handlePhysicalSubmit}>Submit</Button>
          </div>
          {inputError && <p className="text-sm text-destructive text-center">{inputError}</p>}
        </div>
      )}
    </div>
  )
}
