'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { ClassCard } from '@/components/onboarding/class-card'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { LoadingShimmer } from '@/components/layout/loading-shimmer'
import { useGameStore } from '@/stores/game-store'
import { useGameAI } from '@/hooks/use-game-ai'
import { heroVisualDescription } from '@/lib/game/appearance'
import { savePortrait, loadPortraitEntry, downscalePortrait } from '@/lib/portraits'
import { t } from '@/lib/i18n'
import type { CharacterClass } from '@/types/game'
import { cn } from '@/lib/utils'

export default function CharactersPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters, setCharacter, _hasHydrated, language } = useGameStore()

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

  // Show a previously generated portrait when revisiting a player. One
  // painted before heroes started empty-handed still shows the free class
  // gear the family never bought, so it gets repainted on the spot — once
  // per player, so a repaint that fails doesn't become a retry loop. The
  // stale face stays on screen until the new one lands.
  const repaintedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!currentPlayer) return
    const playerId = currentPlayer.id
    setPortraitUrl(null)
    setPortraitFailed(false)
    loadPortraitEntry(playerId).then(entry => {
      if (!entry) return
      setPortraitUrl(entry.dataUrl)
      if (!entry.stale || repaintedRef.current.has(playerId)) return
      // The saved character, not the half-synced form state: this can fire
      // before the hydration effect has filled in the class and name.
      const saved = characters.find(c => c.playerId === playerId)
      if (saved) {
        repaintedRef.current.add(playerId)
        paintPortrait(saved.name, saved.class, saved.gender)
      }
    })
  }, [currentPlayer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const paintPortrait = async (
    name: string,
    characterClass: CharacterClass,
    heroGender: 'male' | 'female' | 'neutral'
  ) => {
    if (!currentPlayer || portraitLoading) return
    setPortraitLoading(true)
    setPortraitFailed(false)
    const description = heroVisualDescription(
      name, characterClass, heroGender, currentPlayer.color, currentPlayer.age
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

  const handleGeneratePortrait = () => {
    if (!selectedClass || !characterName) return
    paintPortrait(characterName, selectedClass, gender)
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
              {t('playerWord', language)} {currentPlayerIndex + 1} {t('ofWord', language)} {selectedPlayers.length}
            </p>
            <h1 className="text-3xl font-serif text-primary">{currentPlayer.name}{t('charTitleSuffix', language)}</h1>
          </div>

          <StepIndicator currentStep={2} />

          <div className="space-y-2">
            <Label>{t('characterNameLabel', language)}</Label>
            <Input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder={`${currentPlayer.name}${t('theBrave', language)}`} />
          </div>

          <div className="space-y-2">
            <Label>{t('avatarStyle', language)}</Label>
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
                  {t(g === 'male' ? 'genderMale' : g === 'female' ? 'genderFemale' : 'genderNeutral', language)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t('chooseClass', language)}</Label>
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
              <Label>{t('heroPortrait', language)}</Label>
              <AnimatePresence mode="wait">
                {/* Capped so the square portrait stays portrait-sized on tablets */}
                {portraitLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingShimmer className="w-full max-w-sm mx-auto aspect-square rounded-lg" />
                    <p className="text-center text-sm text-muted-foreground animate-pulse mt-2">
                      {t('paintingWord', language)} {characterName}...
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
                      🎨 {t('paintAgain', language)}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleGeneratePortrait}>
                      ✨ {t('paintPortrait', language)}
                    </Button>
                    {portraitFailed && (
                      <p className="text-center text-sm text-muted-foreground">
                        {t('painterBusy', language)}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Button size="lg" className="w-full" disabled={!selectedClass || !characterName || portraitLoading} onClick={handleContinue}>
            {isLastPlayer ? t('startAdventure', language) : t('nextPlayer', language)}
          </Button>
        </motion.div>
      </PageContainer>
    </>
  )
}
