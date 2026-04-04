'use client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/game'

interface DifficultyOptionProps {
  difficulty: Difficulty
  selected: boolean
  onSelect: () => void
}

const difficultyData: Record<Difficulty, { name: string; emoji: string; description: string }> = {
  easy: { name: 'Easy', emoji: '🌱', description: 'Gentle challenges, quick wins' },
  medium: { name: 'Medium', emoji: '⚔️', description: 'Balanced challenges' },
  hard: { name: 'Hard', emoji: '🔥', description: 'Real consequences, earned victories' },
}

export function DifficultyOption({ difficulty, selected, onSelect }: DifficultyOptionProps) {
  const data = difficultyData[difficulty]
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex-1 p-3 rounded-lg border-2 transition-all bg-card text-center",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <span className="text-2xl block mb-1">{data.emoji}</span>
      <span className={cn("font-medium block", selected ? "text-primary" : "text-foreground")}>{data.name}</span>
      <span className="text-xs text-muted-foreground">{data.description}</span>
    </button>
  )
}
