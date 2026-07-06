'use client'

import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

// Global language switch — one tap anywhere flips the whole app, and the
// choice persists with the rest of the game settings.
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setSettings, _hasHydrated } = useGameStore()
  if (!_hasHydrated) return null

  const next = language === 'en' ? 'da' : 'en'
  return (
    <button
      onClick={() => setSettings({ language: next })}
      className={cn(
        "inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full bg-card/70 backdrop-blur-sm border border-primary/25 hover:border-primary/60 shadow-lg shadow-black/30 transition-colors",
        className
      )}
      aria-label={language === 'en' ? 'Skift til dansk' : 'Switch to English'}
    >
      <span className="text-lg leading-none">{language === 'en' ? '🇬🇧' : '🇩🇰'}</span>
      <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
    </button>
  )
}
