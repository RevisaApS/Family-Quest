'use client'

import { motion } from 'framer-motion'
import type { EncounterState } from '@/types/game'

// Shared enemy HP bar — small monsters along the quest, the boss at the end.
export function EncounterBanner({ encounter }: { encounter: EncounterState }) {
  const pct = Math.max(0, Math.round((encounter.hp / encounter.maxHp) * 100))
  const isBoss = encounter.kind === 'boss'
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isBoss
          ? 'rounded-lg border-2 border-destructive/50 bg-destructive/10 px-4 py-2.5 space-y-1.5'
          : 'rounded-lg border-2 border-secondary/50 bg-secondary/10 px-4 py-2.5 space-y-1.5'
      }
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl"
        >
          {isBoss ? '👹' : '👾'}
        </motion.span>
        <span className={`font-serif font-medium truncate ${isBoss ? 'text-destructive' : 'text-secondary'}`}>
          {encounter.name}
        </span>
        <span className={`ml-auto text-xs font-bold whitespace-nowrap ${isBoss ? 'text-destructive' : 'text-secondary'}`}>
          {encounter.hp}/{encounter.maxHp} ❤️
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${isBoss ? 'bg-destructive' : 'bg-secondary'}`}
        />
      </div>
    </motion.div>
  )
}
