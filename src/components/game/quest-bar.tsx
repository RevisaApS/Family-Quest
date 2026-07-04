'use client'

import { QUEST_MILESTONES } from '@/lib/game/rpg'
import { t } from '@/lib/i18n'
import type { Quest } from '@/types/game'
import type { Language } from '@/lib/ai/language'

// The visible goal: quest title + milestone swords. Beating encounters
// fills it up — accomplishment you can point at.
export function QuestBar({ quest, language }: { quest: Quest; language: Language }) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 flex items-center gap-2">
      <span className="text-base">📜</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('questLabel', language)}</p>
        <p className="text-sm font-serif text-primary truncate">{quest.title}</p>
      </div>
      <div className="flex gap-1 shrink-0" aria-label={`${quest.milestonesDone}/${QUEST_MILESTONES}`}>
        {Array.from({ length: QUEST_MILESTONES }, (_, i) => (
          <span key={i} className={i < quest.milestonesDone ? '' : 'opacity-25 grayscale'}>⚔️</span>
        ))}
      </div>
    </div>
  )
}
