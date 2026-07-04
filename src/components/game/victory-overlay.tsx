'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { sfx } from '@/lib/sound'
import type { Language } from '@/lib/ai/language'

interface VictoryOverlayProps {
  bossName: string
  language: Language
  goldReward?: number
  onKeepPlaying: () => void
  onNewAdventure: () => void
}

export function VictoryOverlay({ bossName, language, goldReward, onKeepPlaying, onNewAdventure }: VictoryOverlayProps) {
  useEffect(() => { sfx.victory() }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.7 }}
        className="w-full max-w-sm space-y-6 text-center"
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
              💰 +{goldReward} {t('bossGoldReward', language)}
            </motion.p>
          )}
        </div>
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
