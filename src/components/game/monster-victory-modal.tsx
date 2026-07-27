'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { sfx } from '@/lib/sound'
import type { Language } from '@/lib/ai/language'

interface MonsterVictoryModalProps {
  monsterName: string
  finisherName: string
  // The purse this particular monster drops — later monsters pay more
  goldReward: number
  xpReward: number
  language: Language
  onContinue: () => void
}

// Mini celebration when the party takes down a quest monster —
// the finishing blow gets called out, everyone gets paid.
export function MonsterVictoryModal({
  monsterName, finisherName, goldReward, xpReward, language, onContinue,
}: MonsterVictoryModalProps) {
  useEffect(() => { sfx.fanfare() }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-full max-w-sm space-y-5 text-center"
      >
        <motion.span
          className="text-7xl block"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          ⚔️
        </motion.span>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-primary">{t('monsterDefeated', language)}</h2>
          <p className="text-muted-foreground">{monsterName}</p>
          <p className="text-lg">
            🏅 <span className="font-bold text-primary">{finisherName}</span> {t('finishingBlow', language)}
          </p>
          <p className="font-bold text-success">🪙 +{goldReward} {t('goldForAll', language)}</p>
          <p className="font-bold text-primary">⭐ +{xpReward} {t('xpForAll', language)}</p>
        </div>
        <Button className="w-full" size="lg" onClick={onContinue}>
          → ⚔️
        </Button>
      </motion.div>
    </div>
  )
}
