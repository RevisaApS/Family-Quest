import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import type { CharacterClass } from '@/types/game'

interface PlayerTurnProps {
  playerName: string
  characterName: string
  characterClass: CharacterClass
}

export function PlayerTurn({ playerName, characterName, characterClass }: PlayerTurnProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-card rounded-full border border-primary/30">
      <span className="text-xl">{classDef.emoji}</span>
      <span className="text-sm">
        <span className="text-muted-foreground">{playerName} as </span>
        <span className="text-primary font-medium">{characterName}</span>
      </span>
    </div>
  )
}
