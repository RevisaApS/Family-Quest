'use client'

import { cn } from '@/lib/utils'
import { statLabel } from '@/lib/i18n'
import type { Stat } from '@/types/game'
import type { GeneratedAction } from '@/types/ai'
import type { Language } from '@/lib/ai/language'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

interface ActionPickerProps {
  options: GeneratedAction[]
  // The hero's own bonus for each action's stat. Kids weigh "which one am I
  // good at?" — the exact roll needed is only revealed AFTER they commit,
  // so nobody just grabs the lowest number.
  statBonusFor?: (option: GeneratedAction) => number
  language: Language
  onSelect: (option: GeneratedAction) => void
  disabled?: boolean
}

export function ActionPicker({ options, statBonusFor, language, onSelect, disabled }: ActionPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-muted-foreground text-sm">What do you do?</p>
      <div className="space-y-2">
        {options.map((option) => {
          const bonus = statBonusFor?.(option)
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
                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary">
                  {statLabel(option.stat, language)}
                  {bonus !== undefined && ` +${bonus}`}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
