'use client'

import { motion } from 'framer-motion'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import { useGameStore } from '@/stores/game-store'
import { classLabel } from '@/lib/i18n'
import type { CharacterClass } from '@/types/game'

interface PlayerTurnProps {
  playerName: string
  characterName: string
  characterClass: CharacterClass
}

export function PlayerTurn({ characterName, characterClass }: PlayerTurnProps) {
  const language = useGameStore(s => s.language)
  const classDef = CLASS_DEFINITIONS[characterClass]
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="card-surface flex items-center gap-3 py-3 px-4 border border-primary/20 border-l-4 border-l-primary rounded-xl shadow-lg shadow-primary/10"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40 text-xl">
        {classDef.emoji}
      </span>
      <div className="flex flex-col">
        <span className="text-base font-serif font-medium text-primary">{characterName}</span>
        <span className="text-sm text-muted-foreground">{classLabel(characterClass, language)}</span>
      </div>
      <div className="ml-auto">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full bg-primary"
        />
      </div>
    </motion.div>
  )
}
