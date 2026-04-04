'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { SceneDisplay } from '@/components/game/scene-display'
import { PlayerTurn } from '@/components/game/player-turn'
import { ActionPicker } from '@/components/game/action-picker'
import { DiceRoller } from '@/components/game/dice-roller'
import { OutcomeDisplay } from '@/components/game/outcome-display'
import { ErrorMessage } from '@/components/game/error-message'
import { useGameStore } from '@/stores/game-store'
import { useGameAI } from '@/hooks/use-game-ai'
import { calculateOutcome } from '@/lib/game/mechanics'
import { getClassStats } from '@/lib/game/classes'
import { Button } from '@/components/ui/button'
import type { GeneratedAction, StoryContext } from '@/types/ai'
import type { OutcomeType } from '@/types/game'

const MAX_STORY_HISTORY = 10

export default function PlayPage() {
  const router = useRouter()
  const {
    players, selectedPlayerIds, characters, difficulty,
    adventureStyle, dicePreference, storyHistory, turnHistory,
    currentPlayerIndex, updateAdventureState, _hasHydrated,
  } = useGameStore()
  const {
    loadingScene, loadingActions, loadingOutcome,
    error, fetchScene, fetchActions, fetchOutcome,
  } = useGameAI()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))

  const currentPlayer = selectedPlayers[currentPlayerIndex]
  const currentCharacter = characters.find(c => c.playerId === currentPlayer?.id)

  const [narration, setNarration] = useState('')
  const [currentSceneText, setCurrentSceneText] = useState('')
  const [actions, setActions] = useState<GeneratedAction[]>([])
  const [gamePhase, setGamePhase] = useState<'loading' | 'scene' | 'action' | 'dice' | 'outcome'>('loading')
  const [selectedAction, setSelectedAction] = useState<GeneratedAction | null>(null)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null)
  const [outcomeNarrative, setOutcomeNarrative] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null)

  // Build story context for AI calls
  const buildStoryContext = useCallback((): StoryContext => ({
    adventureStyle,
    storyHistory: storyHistory.slice(-MAX_STORY_HISTORY),
    characters: selectedPlayers.map(p => {
      const char = characters.find(c => c.playerId === p.id)!
      return {
        playerId: p.id,
        playerName: p.name,
        characterName: char.name,
        class: char.class,
      }
    }),
    currentPlayerId: currentPlayer?.id ?? '',
  }), [adventureStyle, storyHistory, selectedPlayers, characters, currentPlayer])

  // Load scene for current player
  const loadScene = useCallback(async () => {
    setGamePhase('loading')
    setNarration('')
    setActions([])
    setSelectedAction(null)
    setDiceResult(null)
    setOutcomeType(null)
    setOutcomeNarrative('')
    setRetryFn(null)

    const context = buildStoryContext()
    const scene = await fetchScene(context)
    if (scene) {
      setNarration(scene.narration)
      setCurrentSceneText(scene.narration)
      setGamePhase('scene')
    } else {
      setRetryFn(() => () => { loadScene() })
    }
  }, [buildStoryContext, fetchScene])

  // Load actions for current scene
  const loadActions = useCallback(async () => {
    const context = buildStoryContext()
    const generatedActions = await fetchActions(context, currentSceneText)
    if (generatedActions) {
      setActions(generatedActions)
    } else {
      setRetryFn(() => () => { loadActions() })
    }
  }, [buildStoryContext, fetchActions, currentSceneText])

  // Validate all players have characters
  useEffect(() => {
    if (!_hasHydrated) return
    const missingCharacter = selectedPlayers.some(p => !characters.find(c => c.playerId === p.id))
    if (missingCharacter || selectedPlayers.length === 0) {
      router.push('/characters')
    }
  }, [_hasHydrated, selectedPlayers, characters, router])

  // Load first scene on mount, and new scene on player rotation
  const [turnCounter, setTurnCounter] = useState(0)
  useEffect(() => {
    if (!_hasHydrated || !currentPlayer) return
    loadScene()
  }, [_hasHydrated, turnCounter]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleChooseAction = async () => {
    setGamePhase('action')
    await loadActions()
  }

  const handleActionSelect = (action: GeneratedAction) => {
    setSelectedAction(action)
    setGamePhase('dice')
  }

  const handleDiceRoll = async (result: number) => {
    setDiceResult(result)

    if (!selectedAction || !currentCharacter) return

    const stats = getClassStats(currentCharacter.class)
    const calculated = calculateOutcome({
      sceneFit: selectedAction.sceneFit,
      statValue: stats[selectedAction.stat],
      diceRoll: result,
      difficulty,
    })
    setOutcomeType(calculated.outcome)
    setGamePhase('outcome')

    // Fetch AI-generated outcome narrative
    const context = buildStoryContext()
    const narrative = await fetchOutcome(
      context,
      selectedAction.text,
      selectedAction.stat,
      calculated.outcome,
      currentSceneText,
    )
    if (narrative) {
      setOutcomeNarrative(narrative)
    } else {
      setOutcomeNarrative('The story continues...')
    }
  }

  const handleContinue = () => {
    // Append turn summary to story history
    const turnSummary = `${currentPlayer.name}'s character ${currentCharacter.name} chose to ${selectedAction?.text}. Using ${selectedAction?.stat}, they ${outcomeType === 'success' ? 'succeeded' : outcomeType === 'partial' ? 'partially succeeded' : 'faced a twist'}. ${outcomeNarrative}`

    const newStoryHistory = [...storyHistory, turnSummary].slice(-MAX_STORY_HISTORY)
    const newTurnHistory = [...turnHistory, {
      playerId: currentPlayer.id,
      actionChosen: selectedAction?.text ?? '',
      stat: selectedAction?.stat ?? 'strength',
      sceneFit: selectedAction?.sceneFit ?? 'okay',
      diceRoll: diceResult ?? 0,
      outcome: outcomeType ?? 'partial',
      narrativeResult: outcomeNarrative,
    }]

    const nextPlayerIndex = (currentPlayerIndex + 1) % selectedPlayers.length

    updateAdventureState({
      currentScene: currentSceneText,
      storyHistory: newStoryHistory,
      turnHistory: newTurnHistory,
      currentPlayerIndex: nextPlayerIndex,
    })

    // Trigger new scene load
    setTurnCounter(prev => prev + 1)
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

        {/* Error display with retry */}
        {error && retryFn && (
          <ErrorMessage message={error} onRetry={retryFn} />
        )}

        <SceneDisplay
          narration={narration}
          isLoadingNarration={loadingScene}
          isLoadingImage={false}
        />

        {!loadingScene && narration && gamePhase === 'scene' && (
          <Button className="w-full" onClick={handleChooseAction}>
            Choose Action
          </Button>
        )}

        {gamePhase === 'action' && (
          loadingActions ? (
            <div className="text-center text-muted-foreground animate-pulse py-4">
              Thinking of what you can do...
            </div>
          ) : actions.length > 0 ? (
            <ActionPicker options={actions} onSelect={handleActionSelect} />
          ) : null
        )}

        {gamePhase === 'dice' && selectedAction && (
          <DiceRoller stat={selectedAction.stat} dicePreference={dicePreference} onRoll={handleDiceRoll} />
        )}

        {gamePhase === 'outcome' && outcomeType && diceResult !== null && (
          <OutcomeDisplay
            outcome={outcomeType}
            diceRoll={diceResult}
            narrative={outcomeNarrative}
            isLoading={loadingOutcome || !outcomeNarrative}
            onContinue={handleContinue}
          />
        )}
      </div>
    </PageContainer>
  )
}
