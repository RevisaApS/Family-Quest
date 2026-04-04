'use client'

import { cn } from '@/lib/utils'
import type { AdventureStyle } from '@/types/game'

interface StyleOptionProps {
  style: AdventureStyle
  selected: boolean
  onSelect: () => void
}

const styleData: Record<AdventureStyle, { name: string; ages: string; emoji: string; description: string; bgClass: string }> = {
  whimsical: { name: 'Whimsical', ages: '4-7', emoji: '🌈', description: 'Bright, gentle, storybook adventures', bgClass: 'from-orange-400 to-amber-400' },
  realistic: { name: 'Realistic', ages: '7-12', emoji: '⚔️', description: 'Exciting fantasy with action and heroes', bgClass: 'from-emerald-600 to-teal-600' },
  dark: { name: 'Dark', ages: '13+', emoji: '🌑', description: 'Atmospheric with complex themes', bgClass: 'from-slate-700 to-slate-900' },
}

export function StyleOption({ style, selected, onSelect }: StyleOptionProps) {
  const data = styleData[style]
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg overflow-hidden transition-all border-2",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <div className={cn("h-16 flex items-center justify-center bg-gradient-to-r", data.bgClass)}>
        <span className="text-3xl">{data.emoji}</span>
      </div>
      <div className="p-3 bg-card">
        <div className="flex justify-between items-center mb-1">
          <span className="font-serif text-foreground">{data.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{data.ages}</span>
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    </button>
  )
}
