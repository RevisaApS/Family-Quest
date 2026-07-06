'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { OutcomeType, CritType } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export interface PowerAction {
  id: string
  label: string
  onUse: () => void
}

interface OutcomeDisplayProps {
  outcome: OutcomeType
  diceRoll: number
  crit?: CritType
  narrative: string
  isLoading: boolean
  xpGained?: number
  goldGained?: number
  damageTaken?: number
  bossDamage?: number
  bossName?: string
  language?: Language
  // Once-per-adventure powers usable right now (reroll, rally, shield)
  powerActions?: PowerAction[]
  onContinue: () => void
}

const outcomeStyles: Record<OutcomeType, { title: string; emoji: string; bgClass: string; textClass: string }> = {
  success: { title: 'Success!', emoji: '🎉', bgClass: 'bg-success/10 border-success/30', textClass: 'text-success' },
  partial: { title: 'Partial Success', emoji: '⚡', bgClass: 'bg-primary/10 border-primary/30', textClass: 'text-primary' },
  failure: { title: 'Plot Twist!', emoji: '🔄', bgClass: 'bg-secondary/10 border-secondary/30', textClass: 'text-secondary' },
}

export function OutcomeDisplay({
  outcome, diceRoll, crit = null, narrative, isLoading,
  xpGained = 0, goldGained = 0, damageTaken = 0, bossDamage = 0, bossName, language = 'en',
  powerActions = [],
  onContinue,
}: OutcomeDisplayProps) {
  const style = outcomeStyles[outcome]
  return (
    <div className={cn(
      "rounded-xl p-6 border-2 space-y-4 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.07),0_14px_34px_-18px_oklch(0_0_0_/_0.75)]",
      style.bgClass
    )}>
      {crit === 'crit' && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [1.3, 1], opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center rounded-lg bg-success/20 border border-success/40 py-2 font-serif text-success text-lg"
        >
          ⭐ {t('critHit', language)} ⭐
        </motion.div>
      )}
      {crit === 'fumble' && (
        <motion.div
          initial={{ rotate: -4, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          className="text-center rounded-lg bg-secondary/20 border border-secondary/40 py-2 font-serif text-secondary text-lg"
        >
          🙈 {t('fumble', language)}
        </motion.div>
      )}
      <div className="text-center space-y-2">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="inline-block text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        >
          {style.emoji}
        </motion.span>
        <h3 className={cn("text-3xl font-serif font-bold tracking-wide", style.textClass)}>{style.title}</h3>
        <p className="text-muted-foreground">
          🎲 <span className="font-serif font-bold text-lg text-foreground">{diceRoll}</span>
        </p>
      </div>

      {/* RPG feedback: xp, damage dealt/taken */}
      <div className="flex flex-wrap justify-center gap-2 text-sm font-medium">
        {xpGained > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full bg-primary/15 text-primary px-3 py-1"
          >
            +{xpGained} XP
          </motion.span>
        )}
        {goldGained > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-full bg-primary/15 text-primary px-3 py-1"
          >
            🪙 +{goldGained}
          </motion.span>
        )}
        {bossDamage > 0 && bossName && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-full bg-success/15 text-success px-3 py-1"
          >
            ⚔️ {bossName} −{bossDamage} ❤️
          </motion.span>
        )}
        {damageTaken > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-full bg-destructive/15 text-destructive px-3 py-1"
          >
            💔 −{damageTaken} {t('damageTaken', language)}
          </motion.span>
        )}
      </div>

      <div className="page-parchment p-4">
        {isLoading ? (
          <p className="animate-pulse" style={{ color: 'var(--ink-soft)' }}>The story unfolds...</p>
        ) : (
          <p className="drop-cap text-lg leading-relaxed">{narrative}</p>
        )}
      </div>
      {!isLoading && (
        <div className="space-y-2">
          {powerActions.map(action => (
            <Button
              key={action.id}
              variant="outline"
              className="w-full border-primary/40"
              onClick={action.onUse}
            >
              {action.label}
            </Button>
          ))}
          <Button className="w-full" size="lg" onClick={onContinue}>Continue Adventure →</Button>
        </div>
      )}
    </div>
  )
}
