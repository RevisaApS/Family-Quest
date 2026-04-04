'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OutcomeType } from '@/types/game'

interface OutcomeDisplayProps {
  outcome: OutcomeType
  diceRoll: number
  narrative: string
  isLoading: boolean
  onContinue: () => void
}

const outcomeStyles: Record<OutcomeType, { title: string; emoji: string; bgClass: string; textClass: string }> = {
  success: { title: 'Success!', emoji: '🎉', bgClass: 'bg-success/10 border-success/30', textClass: 'text-success' },
  partial: { title: 'Partial Success', emoji: '⚡', bgClass: 'bg-primary/10 border-primary/30', textClass: 'text-primary' },
  failure: { title: 'Plot Twist!', emoji: '🔄', bgClass: 'bg-secondary/10 border-secondary/30', textClass: 'text-secondary' },
}

export function OutcomeDisplay({ outcome, diceRoll, narrative, isLoading, onContinue }: OutcomeDisplayProps) {
  const style = outcomeStyles[outcome]
  return (
    <div className={cn("rounded-lg p-6 border-2 space-y-4", style.bgClass)}>
      <div className="text-center space-y-2">
        <span className="text-4xl">{style.emoji}</span>
        <h3 className={cn("text-2xl font-serif", style.textClass)}>{style.title}</h3>
        <p className="text-muted-foreground">
          You rolled a <span className="font-bold text-foreground">{diceRoll}</span>
        </p>
      </div>
      <div className="bg-card rounded-lg p-4">
        {isLoading ? (
          <p className="text-muted-foreground animate-pulse">The story unfolds...</p>
        ) : (
          <p className="text-foreground leading-relaxed">{narrative}</p>
        )}
      </div>
      {!isLoading && (
        <Button className="w-full" size="lg" onClick={onContinue}>Continue Adventure →</Button>
      )}
    </div>
  )
}
