'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import { SLOT_EMOJI, SLOT_LABEL, ALL_SLOTS } from '@/lib/game/loot'
import { xpForNextLevel } from '@/lib/game/rpg'
import { loadPortrait } from '@/lib/portraits'
import { t, statLabel } from '@/lib/i18n'
import type { HeroState, CharacterClass } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface InventoryModalProps {
  hero: HeroState
  characterName: string
  characterClass: CharacterClass
  language: Language
  onClose: () => void
}

export function InventoryModal({ hero, characterName, characterClass, language, onClose }: InventoryModalProps) {
  const [portrait, setPortrait] = useState<string | null>(null)
  useEffect(() => { loadPortrait(hero.playerId).then(setPortrait) }, [hero.playerId])

  const nextLevelXp = xpForNextLevel(hero.level)

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-4 pb-8"
      >
        {/* Hero header */}
        <div className="flex items-center gap-3">
          {portrait ? (
            <img
              src={portrait}
              alt={characterName}
              className="w-20 h-20 rounded-lg object-cover border-2 border-primary/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-card border border-border flex items-center justify-center text-4xl">
              {CLASS_DEFINITIONS[characterClass].emoji}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-serif text-primary leading-tight truncate">{characterName}</h2>
            <p className="text-sm text-muted-foreground">
              {CLASS_DEFINITIONS[characterClass].displayName} · {t('level', language)} {hero.level}
            </p>
            <p className="text-sm">
              ❤️ {hero.hp}/{hero.maxHp} <span className="ml-2">💰 {hero.gold}</span>
            </p>
          </div>
        </div>

        {/* XP progress */}
        {nextLevelXp !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>XP</span>
              <span>{hero.xp} / {nextLevelXp}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.round((hero.xp / nextLevelXp) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Equipment slots */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t('inventory', language)}</h3>
          {ALL_SLOTS.map(slot => {
            const item = hero.equipment[slot]
            return (
              <div key={slot} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                <span className="text-2xl">{item?.emoji ?? SLOT_EMOJI[slot]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{SLOT_LABEL[slot][language]}</p>
                  {item ? (
                    <p className="font-serif text-foreground truncate">
                      {item.name}
                      {item.bonus > 0 && (
                        <span className="ml-2 text-xs font-bold text-success">
                          +{item.bonus} {statLabel(item.stat, language)}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">{t('empty', language)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Skills */}
        {hero.skills.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('skills', language)}</h3>
            {hero.skills.map(skill => (
              <div key={skill.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                <span className="text-2xl">{skill.emoji}</span>
                <div className="min-w-0">
                  <p className="font-serif truncate">{skill.name}</p>
                  <p className="text-xs text-success font-bold">+{skill.bonus} {statLabel(skill.stat, language)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onClose}>
          {t('close', language)}
        </Button>
      </motion.div>
    </div>
  )
}
