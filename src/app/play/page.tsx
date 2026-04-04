'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { SceneDisplay } from '@/components/game/scene-display'
import { PlayerTurn } from '@/components/game/player-turn'
import { ActionPicker } from '@/components/game/action-picker'
import { DiceRoller } from '@/components/game/dice-roller'
import { OutcomeDisplay } from '@/components/game/outcome-display'
import { useGameStore } from '@/stores/game-store'
import { calculateOutcome } from '@/lib/game/mechanics'
import { getClassStats } from '@/lib/game/classes'
import { Button } from '@/components/ui/button'
import type { Stat } from '@/types/game'

interface ActionOption {
  id: string
  text: string
  stat: Stat
}

const MOCK_SCENE = {
  narration: "You stand at the entrance of a dark cave. The air is cool and damp. Strange sounds echo from within, and a faint glow flickers in the distance. What do you do?",
}

const MOCK_ACTIONS: ActionOption[] = [
  { id: '1', text: "I carefully enter the cave, looking for danger", stat: 'agility' },
  { id: '2', text: "I call out to see if anyone is there", stat: 'heart' },
  { id: '3', text: "I cast a light spell to see better", stat: 'magic' },
]

export default function PlayPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters, difficulty, dicePreference } = useGameStore()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)

  const currentPlayer = selectedPlayers[currentPlayerIndex]
  const currentCharacter = characters.find(c => c.playerId === currentPlayer?.id)

  const [isLoadingNarration, setIsLoadingNarration] = useState(true)
  const [isLoadingImage, setIsLoadingImage] = useState(true)
  const [narration, setNarration] = useState('')
  const [gamePhase, setGamePhase] = useState<'scene' | 'action' | 'dice' | 'outcome'>('scene')
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<ReturnType<typeof calculateOutcome> | null>(null)
  const [outcomeNarrative, setOutcomeNarrative] = useState('')
  const [isLoadingOutcome, setIsLoadingOutcome] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Validate all players have characters
  useEffect(() => {
    const missingCharacter = selectedPlayers.some(p => !characters.find(c => c.playerId === p.id))
    if (missingCharacter || selectedPlayers.length === 0) {
      router.push('/characters')
    }
  }, [selectedPlayers, characters, router])

  // Simulate scene loading (will be replaced by AI in Phase 4)
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setNarration(MOCK_SCENE.narration)
      setIsLoadingNarration(false)
    }, 1000)
    const timer2 = setTimeout(() => setIsLoadingImage(false), 2000)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  if (!currentPlayer || !currentCharacter) {
    return (
      <PageContainer className="justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No characters found</p>
          <Button onClick={() => router.push('/players')}>Start Over</Button>
        </div>
      </PageContainer>
    )
  }

  const handleActionSelect = (action: ActionOption) => {
    setSelectedAction(action)
    setGamePhase('dice')
  }

  const handleDiceRoll = (result: number) => {
    setDiceResult(result)
    if (selectedAction && currentCharacter) {
      const stats = getClassStats(currentCharacter.class)
      const calculatedOutcome = calculateOutcome({
        sceneFit: 'okay', // Will come from AI later
        statValue: stats[selectedAction.stat],
        diceRoll: result,
        difficulty,
      })
      setOutcome(calculatedOutcome)
      setIsLoadingOutcome(true)
      setTimeout(() => {
        const narratives = {
          success: "Your action succeeds brilliantly! The way forward becomes clear.",
          partial: "It works, but not quite as planned. Something unexpected happens...",
          failure: "That didn't work, but you notice something else interesting!",
        }
        setOutcomeNarrative(narratives[calculatedOutcome.outcome])
        setIsLoadingOutcome(false)
      }, 1500)
    }
    setGamePhase('outcome')
  }

  const handleContinue = () => {
    setGamePhase('scene')
    setSelectedAction(null)
    setDiceResult(null)
    setOutcome(null)
    setOutcomeNarrative('')
    setCurrentPlayerIndex(prev => (prev + 1) % selectedPlayers.length)
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Pause button */}
        <button
          onClick={() => setIsPaused(true)}
          className="fixed top-4 right-4 p-2 rounded-lg bg-card border border-border z-40"
        >
          ⏸
        </button>

        {/* Pause overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg border border-border space-y-4 max-w-xs w-full">
              <h2 className="text-xl font-serif text-primary text-center">Paused</h2>
              <Button className="w-full" onClick={() => setIsPaused(false)}>Resume</Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/')}>Save &amp; Quit</Button>
            </div>
          </div>
        )}

        <PlayerTurn
          playerName={currentPlayer.name}
          characterName={currentCharacter.name}
          characterClass={currentCharacter.class}
        />

        <SceneDisplay
          narration={narration}
          isLoadingNarration={isLoadingNarration}
          isLoadingImage={isLoadingImage}
        />

        {!isLoadingNarration && gamePhase === 'scene' && (
          <Button className="w-full" onClick={() => setGamePhase('action')}>Choose Action</Button>
        )}

        {gamePhase === 'action' && (
          <ActionPicker options={MOCK_ACTIONS} onSelect={handleActionSelect} />
        )}

        {gamePhase === 'dice' && selectedAction && (
          <DiceRoller stat={selectedAction.stat} dicePreference={dicePreference} onRoll={handleDiceRoll} />
        )}

        {gamePhase === 'outcome' && outcome && diceResult && (
          <OutcomeDisplay
            outcome={outcome.outcome}
            diceRoll={diceResult}
            narrative={outcomeNarrative}
            isLoading={isLoadingOutcome}
            onContinue={handleContinue}
          />
        )}
      </div>
    </PageContainer>
  )
}
