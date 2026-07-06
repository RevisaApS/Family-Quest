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
  // Tap a hero chip to open their inventory
  onSelectHero?: (playerId: string) => void
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.round((hp / maxHp) * 100)
  return (
    <div className="bar-shine h-2 w-full rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] overflow-hidden">
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full',
          pct > 50
            ? 'bg-gradient-to-b from-[oklch(0.74_0.11_148)] to-[oklch(0.53_0.10_146)]'
            : pct > 25
              ? 'bg-gradient-to-b from-[oklch(0.78_0.12_62)] to-[oklch(0.58_0.13_48)]'
              : 'bg-gradient-to-b from-[oklch(0.66_0.15_32)] to-[oklch(0.46_0.15_30)]'
        )}
      />
    </div>
  )
}

export function PartyBar({ members, currentPlayerId, language, onSelectHero }: PartyBarProps) {
  return (
    <div className="flex gap-2">
      {members.map(({ playerId, characterName, characterClass, hero }) => {
        const isCurrent = playerId === currentPlayerId
        const gear = Object.values(hero.equipment).filter(Boolean)
        return (
          <button
            key={playerId}
            onClick={() => onSelectHero?.(playerId)}
            className={cn(
              'flex-1 min-w-0 rounded-xl border px-2 py-1.5 space-y-1 transition-all text-left active:scale-[0.98]',
              isCurrent
                ? 'panel-ember glow-pulse border-primary/60'
                : 'card-surface border-primary/10',
              hero.knockedOut && 'opacity-60 grayscale'
            )}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-base leading-none">
                {hero.knockedOut ? '😵' : CLASS_DEFINITIONS[characterClass].emoji}
              </span>
              <span className="text-xs font-medium truncate">{characterName}</span>
              <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-bold text-primary whitespace-nowrap">
                {t('level', language)} {hero.level}
              </span>
            </div>
            <HpBar hp={hero.hp} maxHp={hero.maxHp} />
            <div className="flex items-center gap-0.5 h-4 text-[10px]">
              <span className="text-muted-foreground">❤️ {hero.hp}/{hero.maxHp}</span>
              <span className="text-muted-foreground ml-1.5">🪙 {hero.gold}</span>
              {(gear.length > 0 || hero.pet) && (
                <span className="ml-auto truncate">
                  {hero.pet?.emoji}
                  {gear.map(item => item!.emoji).join('')}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
