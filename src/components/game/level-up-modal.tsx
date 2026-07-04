'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { t, statLabel } from '@/lib/i18n'
import { sfx } from '@/lib/sound'
import type { Skill } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface LevelUpModalProps {
  characterName: string
  newLevel: number
  choices: Skill[]
  language: Language
  onPick: (skill: Skill | null) => void
}

export function LevelUpModal({ characterName, newLevel, choices, language, onPick }: LevelUpModalProps) {
  useEffect(() => { sfx.fanfare() }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-full max-w-sm space-y-5 text-center"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl"
        >
          ⭐
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-3xl font-serif text-primary">{t('levelUp', language)}</h2>
          <p className="text-muted-foreground">
            {characterName} → {t('level', language)} {newLevel}
          </p>
        </div>

        {choices.length > 0 && (
          <>
            <p className="font-medium">{t('pickPower', language)}:</p>
            <div className="space-y-3">
              {choices.map((skill, i) => (
                <motion.button
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  onClick={() => onPick(skill)}
                  className="w-full flex items-center gap-3 rounded-lg border-2 border-primary/30 bg-card p-4 text-left hover:border-primary hover:bg-primary/10 active:scale-[0.98] transition-all"
                >
                  <span className="text-3xl">{skill.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-serif text-primary">{skill.name}</span>
                    <span className="block text-sm text-muted-foreground">{skill.description}</span>
                    <span className="block text-xs font-bold text-success">
                      +{skill.bonus} {statLabel(skill.stat, language)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {choices.length === 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => onPick(null)}
            className="w-full rounded-lg border-2 border-primary bg-primary/10 p-4 font-medium"
          >
            ❤️ +2 HP
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
