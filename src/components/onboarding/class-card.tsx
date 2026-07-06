'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import type { CharacterClass, Stat } from '@/types/game'
import { motion } from 'framer-motion'

interface ClassCardProps {
  characterClass: CharacterClass
  selected: boolean
  onSelect: () => void
}

const statLabel: Record<Stat, string> = { strength: 'STR', magic: 'MAG', agility: 'AGI', heart: 'HP' }

const classBgTint: Record<string, string> = {
  warrior: 'bg-red-950/20',
  wizard: 'bg-purple-950/20',
  rogue: 'bg-emerald-950/20',
  ranger: 'bg-amber-950/20',
}

const classGlowColor: Record<string, string> = {
  warrior: '#ef4444',
  wizard: '#a855f7',
  rogue: '#10b981',
  ranger: '#f59e0b',
}

const classImage: Record<CharacterClass, string> = {
  warrior: '/characters/Warrior.png',
  wizard: '/characters/Wizard.png',
  rogue: '/characters/Rogue.png',
  ranger: '/characters/Ranger.png',
}

export function ClassCard({ characterClass, selected, onSelect }: ClassCardProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]
  const bgTint = classBgTint[characterClass] || ''
  const glowColor = classGlowColor[characterClass] || '#ffd700'

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={selected ? { boxShadow: `0 0 28px -8px ${glowColor}99, inset 0 1px 0 rgba(255,255,255,0.08)` } : undefined}
      className={cn(
        "card-surface w-full text-left p-3 rounded-xl border-2 transition-all",
        bgTint,
        selected ? "border-primary ring-2 ring-primary/25" : "border-primary/10 hover:border-primary/50 hover:shadow-lg"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden ring-1 transition-all",
          selected ? "ring-primary/60" : "ring-white/10"
        )}>
          <Image
            src={classImage[characterClass]}
            alt={classDef.displayName}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-foreground mb-1.5">{classDef.displayName}</h3>
          <div className="space-y-1">
            {(Object.entries(classDef.stats) as [Stat, number][]).map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-muted-foreground font-medium">{statLabel[stat]}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(value / 5) * 100}%`, backgroundColor: glowColor }}
                  />
                </div>
                <span className="text-muted-foreground w-3 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  )
}
