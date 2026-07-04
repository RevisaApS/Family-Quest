'use client'

import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'
import type { GeneratedAction } from '@/types/ai'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

interface ActionPickerProps {
  options: GeneratedAction[]
  // The d20 result needed to succeed with this action — picking an action
  // becomes a real tactical choice when the odds are visible
  requiredRollFor?: (option: GeneratedAction) => number
  onSelect: (option: GeneratedAction) => void
  disabled?: boolean
}

export function ActionPicker({ options, requiredRollFor, onSelect, disabled }: ActionPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-muted-foreground text-sm">What do you do?</p>
      <div className="space-y-2">
        {options.map((option) => {
          const required = requiredRollFor?.(option)
          return (
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
                {required !== undefined && (
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                    required <= 7 ? "bg-success/15 text-success"
                      : required <= 12 ? "bg-primary/15 text-primary"
                      : "bg-destructive/15 text-destructive"
                  )}>
                    🎲 {required}+
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
