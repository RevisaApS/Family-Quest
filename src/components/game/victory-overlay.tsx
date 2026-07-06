'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { sfx } from '@/lib/sound'
import type { Language } from '@/lib/ai/language'

export interface VictoryAward {
  characterName: string
  title: string
  reason: string
}

interface VictoryOverlayProps {
  bossName: string
  language: Language
  goldReward?: number
  // The AI-written storybook epilogue; null/absent when it couldn't be reached
  tale?: { title: string; story: string } | null
  awards?: VictoryAward[]
  taleLoading?: boolean
  onKeepPlaying: () => void
  onNewAdventure: () => void
}

export function VictoryOverlay({
  bossName, language, goldReward, tale, awards = [], taleLoading, onKeepPlaying, onNewAdventure,
}: VictoryOverlayProps) {
  useEffect(() => { sfx.victory() }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.7 }}
        className="w-full max-w-sm space-y-6 text-center py-8"
      >
        <div className="relative">
          {['🎉', '⭐', '🎊', '✨', '🏆'].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [-10, -60 - i * 15], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="absolute text-2xl"
              style={{ left: `${15 + i * 17}%` }}
            >
              {emoji}
            </motion.span>
          ))}
          <span className="text-7xl block pt-8">🏆</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-primary">{t('victory', language)}</h2>
          <p className="text-muted-foreground">
            {t('bossDefeated', language)} ({bossName})
          </p>
          <p className="text-lg">{t('victorySub', language)}</p>
          {goldReward && (
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-xl font-bold text-primary"
            >
              🪙 +{goldReward} {t('bossGoldReward', language)}
            </motion.p>
          )}
        </div>
        {/* The storybook epilogue: the tale of this adventure + one award per kid */}
        {taleLoading && (
          <p className="text-sm text-muted-foreground animate-pulse">
            ✍️ {t('epilogueWriting', language)}
          </p>
        )}
        {tale && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-card p-4 space-y-2 text-left"
          >
            <h3 className="font-serif text-primary text-lg text-center">📖 {tale.title}</h3>
            <p className="text-sm leading-relaxed text-foreground">{tale.story}</p>
          </motion.div>
        )}
        {awards.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">🏅 {t('awardsTitle', language)}</p>
            {awards.map((award, i) => (
              <motion.div
                key={award.characterName}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.2 }}
                className="rounded-lg border border-border bg-card p-3 text-left"
              >
                <p className="font-serif">
                  🏅 <span className="text-primary">{award.characterName}</span> — {award.title}
                </p>
                <p className="text-xs text-muted-foreground">{award.reason}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={onKeepPlaying}>
            {t('keepPlaying', language)} →
          </Button>
          <Button variant="outline" className="w-full" onClick={onNewAdventure}>
            {t('newAdventure', language)} ✨
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
