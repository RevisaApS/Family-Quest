'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { t, statLabel } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  // "My own idea!" — the kid types (or a parent types for them) their own
  // plan and the DM grades it like any other action.
  onCustomIdea?: (idea: string) => void
  customLoading?: boolean
  disabled?: boolean
}

export function ActionPicker({
  options, statBonusFor, language, onSelect, onCustomIdea, customLoading, disabled,
}: ActionPickerProps) {
  const [ideaOpen, setIdeaOpen] = useState(false)
  const [ideaText, setIdeaText] = useState('')

  const submitIdea = () => {
    const idea = ideaText.trim()
    if (!idea || customLoading) return
    onCustomIdea?.(idea)
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-muted-foreground text-sm">{t('whatDoYouDo', language)}</p>
      <div className="space-y-2">
        {options.map((option) => {
          const bonus = statBonusFor?.(option)
          return (
            <button
              key={option.id}
              onClick={() => !disabled && onSelect(option)}
              disabled={disabled || customLoading}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all bg-card border-border",
                !disabled && !customLoading && "hover:border-primary hover:bg-primary/5",
                (disabled || customLoading) && "opacity-50 cursor-not-allowed"
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

        {onCustomIdea && !ideaOpen && (
          <button
            onClick={() => !disabled && setIdeaOpen(true)}
            disabled={disabled || customLoading}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 border-dashed transition-all bg-card border-primary/40",
              !disabled && !customLoading && "hover:border-primary hover:bg-primary/5",
              (disabled || customLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <p className="text-primary font-medium flex-1">{t('ownIdea', language)}</p>
            </div>
          </button>
        )}

        {onCustomIdea && ideaOpen && (
          <div className="p-4 rounded-lg border-2 border-primary/40 bg-card space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              <p className="text-primary font-medium">{t('ownIdea', language)}</p>
            </div>
            <Input
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitIdea() }}
              placeholder={t('ownIdeaPlaceholder', language)}
              disabled={customLoading}
              autoFocus
            />
            {customLoading ? (
              <p className="text-center text-sm text-muted-foreground animate-pulse py-1">
                {t('ownIdeaThinking', language)}
              </p>
            ) : (
              <Button className="w-full" onClick={submitIdea} disabled={!ideaText.trim()}>
                {t('ownIdeaGo', language)} →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
