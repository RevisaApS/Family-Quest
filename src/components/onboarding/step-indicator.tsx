'use client'

import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'
import { t, type StringKey } from '@/lib/i18n'

const STEP_KEYS: StringKey[] = ['stepPlayers', 'stepSettings', 'stepCharacters']

// The three-dot onboarding trail, shared by the players/settings/characters
// pages so the labels stay in one place (and in one language).
export function StepIndicator({ currentStep }: { currentStep: number }) {
  const language = useGameStore(s => s.language)
  return (
    <div className="flex items-center justify-center mb-6">
      {STEP_KEYS.map((key, i) => (
        <div key={key} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "rounded-full transition-all",
                i < currentStep
                  ? "w-3 h-3 bg-primary"
                  : i === currentStep
                    ? "w-4 h-4 bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : "w-3 h-3 bg-muted"
              )}
            />
            <span className={cn(
              "text-xs mt-1.5",
              i <= currentStep ? "text-primary" : "text-muted-foreground"
            )}>{t(key, language)}</span>
          </div>
          {i < STEP_KEYS.length - 1 && (
            <div className={cn(
              "w-16 h-0.5 mx-2 mb-5",
              i < currentStep ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
