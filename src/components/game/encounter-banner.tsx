'use client'

import { motion } from 'framer-motion'
import { t, statLabel } from '@/lib/i18n'
import type { EncounterState } from '@/types/game'
import type { Language } from '@/lib/ai/language'

// Shared enemy HP bar — small monsters along the quest, the boss at the end.
// An enraged boss (phase 2) shows its revealed weak spot so the kids can
// coordinate who attacks with what.
export function EncounterBanner({ encounter, language }: { encounter: EncounterState; language: Language }) {
  const pct = Math.max(0, Math.round((encounter.hp / encounter.maxHp) * 100))
  const isBoss = encounter.kind === 'boss'
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isBoss
          ? 'rounded-xl border-2 border-destructive/60 bg-gradient-to-b from-destructive/20 to-destructive/5 px-4 py-2.5 space-y-1.5 shadow-[0_0_28px_-8px_oklch(0.64_0.21_27_/_0.6),inset_0_1px_0_oklch(1_0_0_/_0.08)]'
          : 'rounded-xl border-2 border-secondary/60 bg-gradient-to-b from-secondary/20 to-secondary/5 px-4 py-2.5 space-y-1.5 shadow-[0_0_24px_-8px_oklch(0.63_0.13_250_/_0.5),inset_0_1px_0_oklch(1_0_0_/_0.08)]'
      }
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl"
        >
          {encounter.enraged ? '🔥' : isBoss ? '👹' : '👾'}
        </motion.span>
        <span className={`font-serif font-medium truncate ${isBoss ? 'text-destructive' : 'text-secondary'}`}>
          {encounter.name}
        </span>
        <span className={`ml-auto text-xs font-bold whitespace-nowrap ${isBoss ? 'text-destructive' : 'text-secondary'}`}>
          {encounter.hp}/{encounter.maxHp} ❤️
        </span>
      </div>
      <div className="bar-shine h-2.5 rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${isBoss ? 'bg-gradient-to-b from-red-400 to-red-700' : 'bg-gradient-to-b from-sky-300 to-blue-600'}`}
        />
      </div>
      {encounter.enraged && encounter.weakStat && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between text-xs font-bold"
        >
          <span className="text-destructive">🔥 {t('enraged', language)}</span>
          <span className="rounded-full bg-success/15 text-success px-2.5 py-0.5">
            ✨ {t('weakSpot', language)}: {statLabel(encounter.weakStat, language)} +1 ⚔️
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
