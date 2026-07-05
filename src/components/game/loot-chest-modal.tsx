'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { t, statLabel } from '@/lib/i18n'
import { SLOT_LABEL } from '@/lib/game/loot'
import { ItemImage } from '@/components/game/item-image'
import { sfx } from '@/lib/sound'
import type { LootItem } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export type ChestContent =
  | { kind: 'item'; item: LootItem }
  | { kind: 'gold'; amount: number }

interface LootChestModalProps {
  content: ChestContent
  currentItem: LootItem | null
  // True while the AI is still naming the item — the image waits for it
  namePending?: boolean
  language: Language
  // For items: equip=true replaces whatever is in the slot; false discards
  // the find. For gold the coins are always taken.
  onResolve: (equip: boolean) => void
}

export function LootChestModal({ content, currentItem, namePending, language, onResolve }: LootChestModalProps) {
  const [opened, setOpened] = useState(false)

  const handleOpen = () => {
    if (opened) return
    sfx.chestOpen()
    setOpened(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5 text-center">
        <h2 className="text-2xl font-serif text-primary">
          {opened && content.kind === 'gold' ? t('goldFound', language) : t('treasureFound', language)}
        </h2>

        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.div key="chest" exit={{ scale: 1.3, opacity: 0 }} className="space-y-4">
              <motion.button
                onClick={handleOpen}
                animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-8xl"
                aria-label={t('tapToOpen', language)}
              >
                🧰
              </motion.button>
              <p className="text-muted-foreground animate-pulse">{t('tapToOpen', language)}</p>
            </motion.div>
          ) : content.kind === 'gold' ? (
            <motion.div
              key="gold"
              initial={{ scale: 0.3, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.7 }}
              className="space-y-4"
            >
              <motion.span
                className="text-7xl block"
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                🪙
              </motion.span>
              <p className="text-3xl font-serif text-primary">+{content.amount}</p>
              <Button className="w-full" size="lg" onClick={() => onResolve(true)}>
                {t('takeGold', language)} ✨
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="item"
              initial={{ scale: 0.3, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.7 }}
              className="space-y-4"
            >
              <div className="relative inline-block">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 rounded-full border-2 border-dashed border-primary/30"
                />
                <ItemImage
                  item={content.item}
                  defer={namePending}
                  className="w-36 h-36 md:w-56 md:h-56 rounded-xl border-2 border-primary/40 mx-auto"
                  emojiClassName="text-7xl"
                />
              </div>
              {content.item.bonus >= 2 && (
                <span className="inline-block rounded-full bg-primary/20 text-primary text-xs font-bold px-3 py-1">
                  ✨ {t('rare', language)}
                </span>
              )}
              <div className="space-y-1">
                <h3 className="text-xl font-serif text-primary">{content.item.name}</h3>
                <p className="text-sm text-muted-foreground">{SLOT_LABEL[content.item.slot][language]}</p>
                <p className="font-bold text-success">
                  +{content.item.bonus} {statLabel(content.item.stat, language)}
                </p>
              </div>

              {currentItem ? (
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={() => onResolve(true)}>
                    {t('replaceQuestion', language)} {currentItem.name} ({currentItem.emoji} +{currentItem.bonus} {statLabel(currentItem.stat, language)})
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => onResolve(false)}>
                    {t('keepCurrent', language)} {currentItem.name}
                  </Button>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={() => onResolve(true)}>
                  {t('equip', language)} ✨
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
