'use client'

import { cn } from '@/lib/utils'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import type { CharacterClass, Stat } from '@/types/game'

interface ClassCardProps {
  characterClass: CharacterClass
  selected: boolean
  onSelect: () => void
}

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

export function ClassCard({ characterClass, selected, onSelect }: ClassCardProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all bg-card",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl">{classDef.emoji}</span>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-foreground mb-1">{classDef.displayName}</h3>
          <p className="text-sm text-muted-foreground mb-2">{classDef.description}</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(classDef.stats) as [Stat, number][]).map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-1 text-xs">
                <span>{statEmoji[stat]}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full mx-0.5", i < value ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
