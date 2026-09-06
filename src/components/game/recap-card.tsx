'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/ai/language'
import type { RecapBeat } from '@/lib/game/recap'

interface RecapCardProps {
  questTitle?: string
  questGoal?: string
  villain?: string
  beats: RecapBeat[]
  nextHeroName: string
  language: Language
  onContinue: () => void
}

const TAG_EMOJI: Record<NonNullable<RecapBeat['tag']>, string> = { '✓': '🎉', '~': '⚡', '✗': '🔄' }

// The page Far reads aloud before a resumed adventure goes on: what the quest
// is, the last few things that happened, and whose turn it is. Nothing here
// waits on the network — the next scene is already being written underneath.
export function RecapCard({ questTitle, questGoal, villain, beats, nextHeroName, language, onContinue }: RecapCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="page-parchment p-5 sm:p-6 space-y-4 max-w-2xl mx-auto"
      data-testid="recap-card"
    >
      <h2 className="font-serif text-2xl text-center">📖 {t('recapTitle', language)}</h2>

      {(questTitle || villain) && (
        <div className="text-center space-y-1">
          {questTitle && (
            <p className="font-serif text-lg">
              {questTitle}{questGoal ? <span className="text-base" style={{ color: 'var(--ink-soft)' }}> — {questGoal}</span> : null}
            </p>
          )}
          {villain && (
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              {t('villainLabel', language)}: <span className="font-medium">{villain}</span>
            </p>
          )}
        </div>
      )}

      <ol className="space-y-3">
        {beats.map((b, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="text-xl leading-7 shrink-0">{b.tag ? TAG_EMOJI[b.tag] : '📜'}</span>
            <p className="text-lg leading-relaxed">
              {b.hero && <span className="font-medium">{b.hero}: </span>}
              {b.text}
            </p>
          </li>
        ))}
      </ol>

      <p className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
        {t('nextUpLabel', language)}: <span className="font-medium">{nextHeroName}</span>
      </p>

      <Button className="w-full" size="lg" onClick={onContinue}>
        {t('recapGo', language)}
      </Button>
    </motion.div>
  )
}
