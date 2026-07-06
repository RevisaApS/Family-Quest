'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { AdventureStyle } from '@/types/game'

interface StyleOptionProps {
  style: AdventureStyle
  selected: boolean
  onSelect: () => void
}

const styleData: Record<AdventureStyle, { name: string; ages: string; emoji: string; bgTint: string }> = {
  whimsical: { name: 'Whimsical', ages: '4-7', emoji: '🌈', bgTint: 'bg-orange-950/20' },
  realistic: { name: 'Epic', ages: '7-12', emoji: '🐉', bgTint: 'bg-emerald-950/20' },
  dark: { name: 'Dark', ages: '13+', emoji: '💀', bgTint: 'bg-slate-950/30' },
}

export function StyleOption({ style, selected, onSelect }: StyleOptionProps) {
  const data = styleData[style]
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "card-surface flex-1 p-3 rounded-xl border-2 transition-all text-center",
        data.bgTint,
        selected
          ? "border-primary ring-2 ring-primary/25 shadow-[0_0_24px_-8px_oklch(0.68_0.14_52_/_0.6)]"
          : "border-primary/10 hover:border-primary/40"
      )}
    >
      <span className="text-3xl block mb-1">{data.emoji}</span>
      <span className="font-serif text-foreground block">{data.name}</span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-block mt-1">{data.ages}</span>
    </motion.button>
  )
}
