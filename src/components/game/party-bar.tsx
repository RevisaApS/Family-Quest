'use client'

import { motion } from 'framer-motion'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { HeroState, CharacterClass } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export interface PartyMember {
  playerId: string
  characterName: string
  characterClass: CharacterClass
  hero: HeroState
}

interface PartyBarProps {
  members: PartyMember[]
  currentPlayerId: string
  language: Language
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.round((hp / maxHp) * 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full',
          pct > 50 ? 'bg-success' : pct > 25 ? 'bg-primary' : 'bg-destructive'
        )}
      />
    </div>
  )
}

export function PartyBar({ members, currentPlayerId, language }: PartyBarProps) {
  return (
    <div className="flex gap-2">
      {members.map(({ playerId, characterName, characterClass, hero }) => {
        const isCurrent = playerId === currentPlayerId
        const gear = Object.values(hero.equipment).filter(Boolean)
        return (
          <div
            key={playerId}
            className={cn(
              'flex-1 min-w-0 rounded-lg border px-2 py-1.5 space-y-1 transition-all',
              isCurrent ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' : 'border-border bg-card',
              hero.knockedOut && 'opacity-60 grayscale'
            )}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-base leading-none">
                {hero.knockedOut ? '😵' : CLASS_DEFINITIONS[characterClass].emoji}
              </span>
              <span className="text-xs font-medium truncate">{characterName}</span>
              <span className="ml-auto text-[10px] font-bold text-primary whitespace-nowrap">
                {t('level', language)} {hero.level}
              </span>
            </div>
            <HpBar hp={hero.hp} maxHp={hero.maxHp} />
            <div className="flex items-center gap-0.5 h-4 text-[10px]">
              <span className="text-muted-foreground">❤️ {hero.hp}/{hero.maxHp}</span>
              {gear.length > 0 && (
                <span className="ml-auto">{gear.map(item => item!.emoji).join('')}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
