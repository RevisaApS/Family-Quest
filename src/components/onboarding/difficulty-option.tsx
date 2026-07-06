'use client'

import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'
import { t, type StringKey } from '@/lib/i18n'
import type { Difficulty } from '@/types/game'

interface DifficultyOptionProps {
  difficulty: Difficulty
  selected: boolean
  onSelect: () => void
}

const difficultyData: Record<Difficulty, { nameKey: StringKey; emoji: string }> = {
  easy: { nameKey: 'diffEasy', emoji: '🌱' },
  medium: { nameKey: 'diffMedium', emoji: '⚔️' },
  hard: { nameKey: 'diffHard', emoji: '🔥' },
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
  const language = useGameStore(s => s.language)
  const data = difficultyData[difficulty]
  const colors = difficultyColors[difficulty]
  return (
    <button
      onClick={onSelect}
      className={cn(
        "card-surface flex-1 p-3 rounded-xl border-2 transition-all text-center active:scale-[0.98]",
        selected ? colors.selected : "border-primary/10 hover:border-primary/40"
      )}
    >
      <span className="text-2xl block mb-1">{data.emoji}</span>
      <span className={cn("font-medium block", selected ? colors.text : "text-foreground")}>{t(data.nameKey, language)}</span>
    </button>
  )
}
