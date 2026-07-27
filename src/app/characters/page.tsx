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
import {
  savePortrait, loadPortraitEntry, loadPortraitVariant, downscalePortrait,
} from '@/lib/portraits'
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

  // What the hero looks like right now, which is exactly what an image
  // request would say — so it doubles as the cache key for the painting.
  const currentDescription = currentPlayer && selectedClass && characterName
    ? heroVisualDescription(
        characterName, selectedClass, gender, currentPlayer.color, currentPlayer.age
      )
    : null

  // The description behind the portrait currently on screen, so "Paint again"
  // can tell "repaint this exact hero" from "the hero changed underneath it".
  const paintedDescriptionRef = useRef<string | null>(null)

  // Sync local state from store after hydration completes
  useEffect(() => {
    if (!_hasHydrated || !currentPlayer) return
    const existing = characters.find(c => c.playerId === currentPlayer.id)
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- form state seeded from the persisted store
      setSelectedClass(existing.class)
      setCharacterName(existing.name)
      setGender(existing.gender)
    } else if (!characterName) {
      setCharacterName(currentPlayer.name)
    }
  }, [_hasHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // `force` is for "paint me a different one" — everything else checks what
  // this player has already been painted as first.
  const paintPortrait = async (description: string, force = false) => {
    if (!currentPlayer || portraitLoading) return
    const playerId = currentPlayer.id

    if (!force) {
      const cached = await loadPortraitVariant(playerId, description)
      if (cached) {
        paintedDescriptionRef.current = description
        setPortraitUrl(cached)
        setPortraitFailed(false)
        await savePortrait(playerId, cached)
        return
      }
    }

    setPortraitLoading(true)
    setPortraitFailed(false)
    const url = await fetchPortrait(description)
    if (url) {
      // Downscale once here so scene requests stay small later
      const small = await downscalePortrait(url)
      paintedDescriptionRef.current = description
      setPortraitUrl(small)
      await savePortrait(playerId, small, description)
    } else {
      setPortraitFailed(true)
    }
    setPortraitLoading(false)
  }

  // Show a previously generated portrait when revisiting a player. One
  // painted before heroes started empty-handed still shows the free class
  // gear the family never bought, so it gets repainted on the spot — once
  // per player, so a repaint that fails doesn't become a retry loop. The
  // stale face stays on screen until the new one lands.
  const repaintedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!currentPlayer) return
    const playerId = currentPlayer.id
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the previous player's face before their own loads
    setPortraitUrl(null)
    setPortraitFailed(false)
    paintedDescriptionRef.current = null
    loadPortraitEntry(playerId).then(entry => {
      if (!entry) return
      setPortraitUrl(entry.dataUrl)
      if (!entry.stale || repaintedRef.current.has(playerId)) return
      // The saved character, not the half-synced form state: this can fire
      // before the hydration effect has filled in the class and name.
      const saved = characters.find(c => c.playerId === playerId)
      if (saved) {
        repaintedRef.current.add(playerId)
        paintPortrait(heroVisualDescription(
          saved.name, saved.class, saved.gender, currentPlayer.color, currentPlayer.age
        ))
      }
    })
  }, [currentPlayer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Changing class, gender or name back to a combination this player has
  // already been painted as brings that painting straight back — no request,
  // no wait, no second bill for a picture the family already has. A miss
  // leaves the old face on screen, same as before.
  useEffect(() => {
    if (!currentPlayer || !currentDescription) return
    if (paintedDescriptionRef.current === currentDescription) return
    const playerId = currentPlayer.id
    let cancelled = false
    loadPortraitVariant(playerId, currentDescription).then(cached => {
      if (cancelled || !cached) return
      paintedDescriptionRef.current = currentDescription
      setPortraitUrl(cached)
      setPortraitFailed(false)
      // Promote it back to this player's active portrait, so walking away
      // now leaves the hero wearing the face that's on screen.
      savePortrait(playerId, cached)
    })
    return () => { cancelled = true }
  }, [currentPlayer?.id, currentDescription]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeneratePortrait = () => {
    if (!currentDescription) return
    paintPortrait(currentDescription)
  }

  // Only a genuine repaint when the face on screen is already this hero's —
  // if the class or name moved on, look for a cached painting of the new one
  // before spending a request.
  const handlePaintAgain = () => {
    if (!currentDescription) return
    paintPortrait(currentDescription, paintedDescriptionRef.current === currentDescription)
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
                    <Button variant="outline" className="w-full" onClick={handlePaintAgain}>
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
