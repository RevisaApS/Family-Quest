'use client'

import { motion } from 'framer-motion'
import type { BossState } from '@/types/game'

export function BossBanner({ boss }: { boss: BossState }) {
  const pct = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border-2 border-destructive/50 bg-destructive/10 px-4 py-2.5 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl"
        >
          👹
        </motion.span>
        <span className="font-serif text-destructive font-medium truncate">{boss.name}</span>
        <span className="ml-auto text-xs font-bold text-destructive whitespace-nowrap">
          {boss.hp}/{boss.maxHp} ❤️
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-destructive"
        />
      </div>
    </motion.div>
  )
}
