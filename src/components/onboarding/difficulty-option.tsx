'use client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/game'

interface DifficultyOptionProps {
  difficulty: Difficulty
  selected: boolean
  onSelect: () => void
}

const difficultyData: Record<Difficulty, { name: string; emoji: string }> = {
  easy: { name: 'Easy', emoji: '🌱' },
  medium: { name: 'Medium', emoji: '⚔️' },
  hard: { name: 'Hard', emoji: '🔥' },
}

const difficultyColors: Record<Difficulty, { selected: string; text: string }> = {
  easy: {
    selected: 'border-emerald-800/30 bg-emerald-950/20 ring-2 ring-emerald-800/20',
    text: 'text-emerald-400',
  },
  medium: {
    selected: 'border-primary ring-2 ring-primary/20',
    text: 'text-primary',
  },
  hard: {
    selected: 'border-red-800/30 bg-red-950/20 ring-2 ring-red-800/20',
    text: 'text-red-400',
  },
}

export function DifficultyOption({ difficulty, selected, onSelect }: DifficultyOptionProps) {
  const data = difficultyData[difficulty]
  const colors = difficultyColors[difficulty]
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex-1 p-3 rounded-lg border-2 transition-all bg-card text-center",
        selected ? colors.selected : "border-border"
      )}
    >
      <span className="text-2xl block mb-1">{data.emoji}</span>
      <span className={cn("font-medium block", selected ? colors.text : "text-foreground")}>{data.name}</span>
    </button>
  )
}
