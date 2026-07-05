'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t, statLabel } from '@/lib/i18n'
import { SLOT_EMOJI, SLOT_LABEL, ALL_SLOTS } from '@/lib/game/loot'
import { shopItemsForSlot, toLootItem, type ShopItem } from '@/lib/game/shop'
import { ItemImage } from '@/components/game/item-image'
import { sfx } from '@/lib/sound'
import { cn } from '@/lib/utils'
import type { HeroState, EquipSlot } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface ShopModalProps {
  hero: HeroState
  characterName: string
  language: Language
  onBuy: (item: ShopItem) => void
  onClose: () => void
}

export function ShopModal({ hero, characterName, language, onBuy, onClose }: ShopModalProps) {
  const [slot, setSlot] = useState<EquipSlot>('weapon')
  const items = shopItemsForSlot(slot)

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm md:max-w-lg space-y-4 pb-8"
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏪</span>
          <div className="min-w-0">
            <h2 className="text-xl font-serif text-primary leading-tight">{t('shop', language)}</h2>
            <p className="text-xs text-muted-foreground truncate">{characterName}</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/15 text-primary font-bold px-3 py-1 whitespace-nowrap">
            🪙 {hero.gold}
          </span>
        </div>

        {/* Slot tabs */}
        <div className="flex gap-1.5">
          {ALL_SLOTS.map(s => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={cn(
                'flex-1 rounded-lg border py-2 text-xl transition-all',
                s === slot ? 'border-primary bg-primary/15' : 'border-border bg-card'
              )}
              aria-label={SLOT_LABEL[s][language]}
            >
              {SLOT_EMOJI[s]}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground -mt-2">{SLOT_LABEL[slot][language]}</p>

        <div className="space-y-2">
          {items.map(item => {
            const owned = hero.equipment[item.slot]?.id === item.id
            const affordable = hero.gold >= item.price
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 flex items-center gap-3',
                  item.tier === 3 ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                  owned && 'opacity-70'
                )}
              >
                <ItemImage
                  item={toLootItem(item, language)}
                  className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-md border border-border"
                  emojiClassName="text-3xl md:text-4xl"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn('font-serif truncate md:text-lg', item.tier === 3 ? 'text-primary' : 'text-foreground')}>
                    {item.name[language]}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <span className="text-success font-bold">+{item.bonus} {statLabel(item.stat, language)}</span>
                  </p>
                </div>
                {owned ? (
                  <span className="text-xs font-bold text-success whitespace-nowrap">✓ {t('equipped', language)}</span>
                ) : (
                  <Button
                    size="sm"
                    variant={affordable ? 'default' : 'outline'}
                    disabled={!affordable}
                    onClick={() => { sfx.chestOpen(); onBuy(item) }}
                    className="whitespace-nowrap"
                  >
                    🪙 {item.price}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>
          {t('close', language)}
        </Button>
      </motion.div>
    </div>
  )
}
