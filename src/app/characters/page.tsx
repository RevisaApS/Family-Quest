'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { ClassCard } from '@/components/onboarding/class-card'
import { useGameStore } from '@/stores/game-store'
import type { CharacterClass } from '@/types/game'
import { cn } from '@/lib/utils'

export default function CharactersPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters, setCharacter } = useGameStore()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const currentPlayer = selectedPlayers[currentPlayerIndex]

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    characters.find(c => c.playerId === currentPlayer?.id)?.class || null
  )
  const [characterName, setCharacterName] = useState(
    characters.find(c => c.playerId === currentPlayer?.id)?.name || ''
  )
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>(
    characters.find(c => c.playerId === currentPlayer?.id)?.gender || 'neutral'
  )

  const handleContinue = () => {
    if (!selectedClass || !characterName || !currentPlayer) return
    setCharacter({ playerId: currentPlayer.id, name: characterName, class: selectedClass, gender })

    if (currentPlayerIndex < selectedPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1)
      const nextPlayer = selectedPlayers[currentPlayerIndex + 1]
      const existingChar = characters.find(c => c.playerId === nextPlayer.id)
      setSelectedClass(existingChar?.class || null)
      setCharacterName(existingChar?.name || '')
      setGender(existingChar?.gender || 'neutral')
    } else {
      router.push('/play')
    }
  }

  if (!currentPlayer) {
    router.push('/players')
    return null
  }

  const isLastPlayer = currentPlayerIndex === selectedPlayers.length - 1

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Player {currentPlayerIndex + 1} of {selectedPlayers.length}
            </p>
            <h1 className="text-3xl font-serif text-primary">{currentPlayer.name}&apos;s Character</h1>
          </div>

          <div className="space-y-2">
            <Label>Character Name</Label>
            <Input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder={`${currentPlayer.name} the Brave`} />
          </div>

          <div className="space-y-2">
            <Label>Avatar Style</Label>
            <div className="flex gap-2">
              {(['male', 'female', 'neutral'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border-2 transition-all capitalize",
                    gender === g ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Choose Class</Label>
            <div className="space-y-2">
              {(['warrior', 'wizard', 'rogue', 'ranger'] as CharacterClass[]).map((cls) => (
                <ClassCard key={cls} characterClass={cls} selected={selectedClass === cls} onSelect={() => setSelectedClass(cls)} />
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={!selectedClass || !characterName} onClick={handleContinue}>
            {isLastPlayer ? 'Start Adventure!' : 'Next Player →'}
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
