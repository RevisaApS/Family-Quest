'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { ClassCard } from '@/components/onboarding/class-card'
import { LoadingShimmer } from '@/components/layout/loading-shimmer'
import { useGameStore } from '@/stores/game-store'
import { useGameAI } from '@/hooks/use-game-ai'
import { heroVisualDescription } from '@/lib/game/appearance'
import { savePortrait, loadPortrait, downscalePortrait } from '@/lib/portraits'
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
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [portraitLoading, setPortraitLoading] = useState(false)
  const [portraitFailed, setPortraitFailed] = useState(false)
  const { fetchPortrait } = useGameAI()

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

  // Show a previously generated portrait when revisiting a player
  useEffect(() => {
    if (!currentPlayer) return
    setPortraitUrl(null)
    setPortraitFailed(false)
    loadPortrait(currentPlayer.id).then(saved => { if (saved) setPortraitUrl(saved) })
  }, [currentPlayer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeneratePortrait = async () => {
    if (!selectedClass || !characterName || !currentPlayer || portraitLoading) return
    setPortraitLoading(true)
    setPortraitFailed(false)
    const description = heroVisualDescription(
      characterName, selectedClass, gender, currentPlayer.color, currentPlayer.age
    )
    const url = await fetchPortrait(description)
    if (url) {
      // Downscale once here so scene requests stay small later
      const small = await downscalePortrait(url)
      setPortraitUrl(small)
      await savePortrait(currentPlayer.id, small)
    } else {
      setPortraitFailed(true)
    }
    setPortraitLoading(false)
  }

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
            <div className="grid gap-2 md:grid-cols-2">
              {(['warrior', 'wizard', 'rogue', 'ranger'] as CharacterClass[]).map((cls) => (
                <ClassCard key={cls} characterClass={cls} selected={selectedClass === cls} onSelect={() => setSelectedClass(cls)} />
              ))}
            </div>
          </div>

          {/* Hero portrait: painted once here, then reused as the visual
              anchor for this hero in every scene image */}
          {selectedClass && characterName && (
            <div className="space-y-3">
              <Label>Hero Portrait</Label>
              <AnimatePresence mode="wait">
                {/* Capped so the square portrait stays portrait-sized on tablets */}
                {portraitLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingShimmer className="w-full max-w-sm mx-auto aspect-square rounded-lg" />
                    <p className="text-center text-sm text-muted-foreground animate-pulse mt-2">
                      Painting {characterName}...
                    </p>
                  </motion.div>
                ) : portraitUrl ? (
                  <motion.div
                    key={portraitUrl}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                  >
                    <img
                      src={portraitUrl}
                      alt={`${characterName} portrait`}
                      className="w-full max-w-sm mx-auto aspect-square object-cover rounded-lg border-2 border-primary/40 shadow-lg shadow-primary/10"
                    />
                    <Button variant="outline" className="w-full" onClick={handleGeneratePortrait}>
                      🎨 Paint Again
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleGeneratePortrait}>
                      ✨ Paint Hero Portrait
                    </Button>
                    {portraitFailed && (
                      <p className="text-center text-sm text-muted-foreground">
                        The painter is busy — you can continue without a portrait and try again later.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Button size="lg" className="w-full" disabled={!selectedClass || !characterName || portraitLoading} onClick={handleContinue}>
            {isLastPlayer ? 'Start Adventure!' : 'Next Player →'}
          </Button>
        </motion.div>
      </PageContainer>
    </>
  )
}
