'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { ClassCard } from '@/components/onboarding/class-card'
import { useGameStore } from '@/stores/game-store'
import type { CharacterClass } from '@/types/game'
import { cn } from '@/lib/utils'

const steps = [
  { label: 'Players', href: '/players' },
  { label: 'Settings', href: '/settings' },
  { label: 'Characters', href: '/characters' },
]

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center mb-6">
    {steps.map((step, i) => (
      <div key={step.label} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "rounded-full transition-all",
              i < currentStep
                ? "w-3 h-3 bg-primary"
                : i === currentStep
                  ? "w-4 h-4 bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  : "w-3 h-3 bg-muted"
            )}
          />
          <span className={cn(
            "text-xs mt-1.5",
            i <= currentStep ? "text-primary" : "text-muted-foreground"
          )}>{step.label}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={cn(
            "w-16 h-0.5 mx-2 mb-5",
            i < currentStep ? "bg-primary" : "bg-muted"
          )} />
        )}
      </div>
    ))}
  </div>
)

export default function CharactersPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters, setCharacter, _hasHydrated } = useGameStore()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const currentPlayer = selectedPlayers[currentPlayerIndex]

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    characters.find(c => c.playerId === currentPlayer?.id)?.class || null
  )
  const [characterName, setCharacterName] = useState(
    characters.find(c => c.playerId === currentPlayer?.id)?.name || currentPlayer?.name || ''
  )
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>(
    characters.find(c => c.playerId === currentPlayer?.id)?.gender || 'neutral'
  )

  // Sync local state from store after hydration completes
  useEffect(() => {
    if (!_hasHydrated || !currentPlayer) return
    const existing = characters.find(c => c.playerId === currentPlayer.id)
    if (existing) {
      setSelectedClass(existing.class)
      setCharacterName(existing.name)
      setGender(existing.gender)
    } else if (!characterName) {
      setCharacterName(currentPlayer.name)
    }
  }, [_hasHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    if (!selectedClass || !characterName || !currentPlayer) return
    setCharacter({ playerId: currentPlayer.id, name: characterName, class: selectedClass, gender })

    if (currentPlayerIndex < selectedPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1)
      const nextPlayer = selectedPlayers[currentPlayerIndex + 1]
      const existingChar = characters.find(c => c.playerId === nextPlayer.id)
      setSelectedClass(existingChar?.class || null)
      setCharacterName(existingChar?.name || nextPlayer.name)
      setGender(existingChar?.gender || 'neutral')
    } else {
      router.push('/play')
    }
  }

  if (!_hasHydrated) {
    return null
  }

  if (!currentPlayer) {
    router.push('/players')
    return null
  }

  const isLastPlayer = currentPlayerIndex === selectedPlayers.length - 1

  return (
    <>
      <Header backHref="/settings" />
      <PageContainer>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Player {currentPlayerIndex + 1} of {selectedPlayers.length}
            </p>
            <h1 className="text-3xl font-serif text-primary">{currentPlayer.name}&apos;s Character</h1>
          </div>

          <StepIndicator currentStep={2} />

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
        </motion.div>
      </PageContainer>
    </>
  )
}
