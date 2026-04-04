'use client'

import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

interface ActionOption {
  id: string
  text: string
  stat: Stat
}

interface ActionPickerProps {
  options: ActionOption[]
  onSelect: (option: ActionOption) => void
  disabled?: boolean
}

export function ActionPicker({ options, onSelect, disabled }: ActionPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-muted-foreground text-sm">What do you do?</p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option)}
            disabled={disabled}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all bg-card border-border",
              !disabled && "hover:border-primary hover:bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{statEmoji[option.stat]}</span>
              <p className="text-foreground flex-1">{option.text}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
