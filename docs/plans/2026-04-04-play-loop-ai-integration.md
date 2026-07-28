# Play Loop AI Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data in the play page with real Gemini 3 Flash AI calls so a family can play through an AI-generated adventure end-to-end.

**Architecture:** The existing three-layer architecture stays: Play Page -> useGameAI hook -> API Routes -> AI lib -> Gemini API. We update the model ID, then wire the unused hook into the play page, replacing all hardcoded mocks. Story context accumulates between turns for narrative coherence.

**Tech Stack:** Next.js 16, React 19, Gemini 3 Flash (`@google/generative-ai`), Zustand, Vitest

**Spec:** `docs/superpowers/specs/2026-04-04-play-loop-ai-integration-design.md`

**IMPORTANT:** Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` per the project's AGENTS.md. APIs may differ from training data.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/ai/gemini.ts` | Modify (line 5-9) | Update model ID to `gemini-3.0-flash` |
| `src/app/play/page.tsx` | Modify (major rewrite) | Wire AI hook, remove mocks, build turn loop |
| `src/components/game/action-picker.tsx` | Modify (line 8-12) | Update local `ActionOption` interface to include `sceneFit` and `sceneFitReason` fields from `GeneratedAction` |
| No other files modified | — | All other code (hooks, API routes, AI libs, store, types) is used as-is |

---

## Task 1: Update Gemini Model ID

**Files:**
- Modify: `src/lib/ai/gemini.ts:5-9`
- Test: `tests/lib/ai/gemini.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/ai/gemini.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock the @google/generative-ai module
vi.mock('@google/generative-ai', () => {
  const getGenerativeModel = vi.fn().mockReturnValue({})
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({ getGenerativeModel })),
  }
})

describe('gemini client', () => {
  it('uses gemini-3.0-flash model', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    // Re-import to trigger module execution with the mock
    await import('@/lib/ai/gemini')

    const instance = (GoogleGenerativeAI as any).mock.results[0].value
    const calls = instance.getGenerativeModel.mock.calls

    expect(calls).toHaveLength(2) // textModel and jsonModel
    expect(calls[0][0].model).toBe('gemini-3.0-flash')
    expect(calls[1][0].model).toBe('gemini-3.0-flash')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/ai/family-quest && npx vitest run tests/lib/ai/gemini.test.ts`

Expected: FAIL — model is currently `gemini-2.5-flash`

- [ ] **Step 3: Update the model ID**

In `src/lib/ai/gemini.ts`, change both occurrences of `gemini-2.5-flash` to `gemini-3.0-flash`:

```typescript
const textModel = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' })

const jsonModel = genAI.getGenerativeModel({
  model: 'gemini-3.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/ai/family-quest && npx vitest run tests/lib/ai/gemini.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ~/ai/family-quest
git add src/lib/ai/gemini.ts tests/lib/ai/gemini.test.ts
git commit -m "feat: update Gemini model to 3.0 Flash"
```

---

## Task 2: Rewrite Play Page — Remove Mocks, Wire AI Hook

This is the core task. Replace the entire mock-based play page with one that uses `useGameAI` for real AI calls.

**Files:**
- Modify: `src/app/play/page.tsx` (major rewrite)

- [ ] **Step 1: Update ActionPicker to use GeneratedAction type**

In `src/components/game/action-picker.tsx`, replace the local `ActionOption` interface with the shared `GeneratedAction` type. This eliminates dual-type issues between the component and the play page.

Replace the imports and interface (lines 1-18):

```typescript
'use client'

import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'
import type { GeneratedAction } from '@/types/ai'

const statEmoji: Record<Stat, string> = { strength: '💪', magic: '✨', agility: '🏃', heart: '❤️' }

interface ActionPickerProps {
  options: GeneratedAction[]
  onSelect: (option: GeneratedAction) => void
  disabled?: boolean
}
```

The rest of the component body stays the same — it only reads `option.id`, `option.text`, and `option.stat`, which all exist on `GeneratedAction`.

- [ ] **Step 2: Read Next.js docs**

Before writing any code, check `node_modules/next/dist/docs/` for relevant guides on client components, hooks, and data fetching patterns. Note any differences from expected patterns.

- [ ] **Step 3: Rewrite the play page**

Replace the contents of `src/app/play/page.tsx` with:

```typescript
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
```

- [ ] **Step 4: Verify the app compiles**

Run: `cd ~/ai/family-quest && npx next build`

Expected: Build succeeds with no type errors. If Next.js 16 has API differences, fix them per the docs read in Step 1.

- [ ] **Step 5: Commit**

```bash
cd ~/ai/family-quest
git add src/app/play/page.tsx src/components/game/action-picker.tsx
git commit -m "feat: wire play page to Gemini AI, replace all mocks with real AI calls"
```

---

## Task 3: Manual Smoke Test

**Files:** None (testing only)

- [ ] **Step 1: Start the dev server**

Run: `cd ~/ai/family-quest && npm run dev`

- [ ] **Step 2: Walk through the full flow**

1. Open `http://localhost:3000`
2. Add a player, select them
3. Pick adventure settings (keep defaults — digital dice, medium difficulty)
4. Create a character (pick any class)
5. Start playing
6. Verify:
   - Scene loads with AI-generated narration (not "You stand at the entrance of a dark cave...")
   - "Choose Action" button appears after scene loads
   - 3 action options appear (AI-generated, not hardcoded)
   - Dice roller works and produces a result
   - Outcome narrative is AI-generated and matches the action/dice result
   - "Continue Adventure" advances to next turn with a new scene
   - New scene references events from the previous turn

- [ ] **Step 3: Verify error handling**

Temporarily break the API key in `.env.local` (add a character), reload, start a game. Verify:
- Error message appears with "Try Again" button
- Clicking retry re-attempts the call
- Fix the API key back after testing

- [ ] **Step 4: Run existing tests to confirm nothing broke**

Run: `cd ~/ai/family-quest && npx vitest run`

Expected: All existing tests pass (mechanics, classes, rotation)

- [ ] **Step 5: Commit any fixes from smoke testing**

If any bugs were found and fixed during smoke testing:

```bash
cd ~/ai/family-quest
git add -A
git commit -m "fix: address issues found during play loop smoke test"
```
