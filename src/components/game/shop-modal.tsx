'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t, statLabel } from '@/lib/i18n'
import { SLOT_EMOJI, SLOT_LABEL, ALL_SLOTS } from '@/lib/game/loot'
import { shopItemsForSlot, toLootItem, type ShopItem } from '@/lib/game/shop'
import { POTION_CATALOG, type PotionDefinition } from '@/lib/game/potions'
import { PET_CATALOG, type PetDefinition } from '@/lib/game/pets'
import { potionCount, MAX_POTIONS } from '@/lib/game/rpg'
import { ItemImage } from '@/components/game/item-image'
import { sfx } from '@/lib/sound'
import { cn } from '@/lib/utils'
import type { HeroState, EquipSlot } from '@/types/game'
import type { Language } from '@/lib/ai/language'

type ShopTab = EquipSlot | 'potion' | 'pet'

interface ShopModalProps {
  hero: HeroState
  characterName: string
  language: Language
  onBuy: (item: ShopItem) => void
  onBuyPotion: (potion: PotionDefinition) => void
  // Kids name their new friend at the counter — blank falls back to the catalog name
  onBuyPet: (pet: PetDefinition, customName: string) => void
  onClose: () => void
}

export function ShopModal({ hero, characterName, language, onBuy, onBuyPotion, onBuyPet, onClose }: ShopModalProps) {
  const [tab, setTab] = useState<ShopTab>('weapon')
  const [namingPetId, setNamingPetId] = useState<string | null>(null)
  const [petName, setPetName] = useState('')

  const tabLabel = tab === 'potion'
    ? t('potionsLabel', language)
    : tab === 'pet'
      ? t('petsLabel', language)
      : SLOT_LABEL[tab][language]

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

        {/* Gear slot tabs + potions + pets */}
        <div className="flex gap-1.5">
          {ALL_SLOTS.map(s => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={cn(
                'flex-1 rounded-lg border py-2 text-xl transition-all',
                s === tab ? 'border-primary bg-primary/15' : 'border-border bg-card'
              )}
              aria-label={SLOT_LABEL[s][language]}
            >
              {SLOT_EMOJI[s]}
            </button>
          ))}
          <button
            onClick={() => setTab('potion')}
            className={cn(
              'flex-1 rounded-lg border py-2 text-xl transition-all',
              tab === 'potion' ? 'border-primary bg-primary/15' : 'border-border bg-card'
            )}
            aria-label={t('potionsLabel', language)}
          >
            🧪
          </button>
          <button
            onClick={() => setTab('pet')}
            className={cn(
              'flex-1 rounded-lg border py-2 text-xl transition-all',
              tab === 'pet' ? 'border-primary bg-primary/15' : 'border-border bg-card'
            )}
            aria-label={t('petsLabel', language)}
          >
            🐾
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground -mt-2">{tabLabel}</p>

        {tab === 'potion' && (
          <div className="space-y-2">
            {POTION_CATALOG.map(potion => {
              const owned = potionCount(hero, potion.id)
              const full = hero.potions.length >= MAX_POTIONS
              const affordable = hero.gold >= potion.price
              return (
                <div key={potion.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                  <span className="text-3xl w-16 text-center shrink-0">{potion.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif truncate md:text-lg text-foreground">
                      {potion.name[language]}
                      {owned > 0 && <span className="ml-2 text-xs font-bold text-primary">×{owned}</span>}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">{potion.description[language]}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={affordable && !full ? 'default' : 'outline'}
                    disabled={!affordable || full}
                    onClick={() => { sfx.chestOpen(); onBuyPotion(potion) }}
                    className="whitespace-nowrap"
                  >
                    🪙 {potion.price}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'pet' && (
          <div className="space-y-2">
            {PET_CATALOG.map(pet => {
              const owned = hero.pet?.id === pet.id
              const affordable = hero.gold >= pet.price
              const naming = namingPetId === pet.id
              return (
                <div
                  key={pet.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-2 border-primary/50 bg-primary/5',
                    owned && 'opacity-70'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl w-16 text-center shrink-0">{pet.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif truncate md:text-lg text-primary">
                        {owned ? hero.pet!.name : pet.name[language]}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        <span className="text-success font-bold">+{pet.bonus} {statLabel(pet.stat, language)}</span>
                      </p>
                    </div>
                    {owned ? (
                      <span className="text-xs font-bold text-success whitespace-nowrap">✓ {t('yours', language)}</span>
                    ) : !naming ? (
                      <Button
                        size="sm"
                        variant={affordable ? 'default' : 'outline'}
                        disabled={!affordable}
                        onClick={() => { setNamingPetId(pet.id); setPetName(pet.name[language]) }}
                        className="whitespace-nowrap"
                      >
                        🪙 {pet.price}
                      </Button>
                    ) : null}
                  </div>
                  {naming && !owned && (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">{t('petNamePrompt', language)}</p>
                      <Input
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        className="text-center"
                        autoFocus
                      />
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => {
                          sfx.fanfare()
                          onBuyPet(pet, petName)
                          setNamingPetId(null)
                        }}
                      >
                        {t('buy', language)} 🪙 {pet.price}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab !== 'potion' && tab !== 'pet' && (
          <div className="space-y-2">
            {shopItemsForSlot(tab).map(item => {
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
        )}

        <Button variant="outline" className="w-full" onClick={onClose}>
          {t('close', language)}
        </Button>
      </motion.div>
    </div>
  )
}
