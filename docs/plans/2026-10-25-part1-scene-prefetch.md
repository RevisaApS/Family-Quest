# Part 1: Scene Prefetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the outcome of a roll is on screen, write the next scene, its actions and its picture in the background, so "Videre" shows the next page at once.

**Architecture:**
- A pure module (`src/lib/game/prefetch.ts`) does two jobs:
  - projects the state the game will be in after "Videre" (story line appended, turn
    count +1, next player, auto-revive applied);
  - turns a `StoryContext` into one comparison key. The key covers the whole context,
    because gear, skills and pet also shape the scene prose and the picture.
- A small hook (`src/hooks/use-scene-prefetch.ts`) owns the in-flight requests and their
  AbortController.
- The play page starts a prefetch when the outcome text lands. `loadScene` takes the
  prefetch when its keys still match, and otherwise fetches fresh exactly as today.

**Tech Stack:** Next.js 16 (App Router, client page), React 19, zustand, vitest.

Spec: `docs/specs/2026-10-25-game-table-ui-design.md`, Part 1.

---

## Background the engineer needs

- `src/app/play/page.tsx` runs the turn loop.
  - `loadScene` (around line 339) resets turn state, auto-revives the next hero if they
    are knocked out, decides the dilemma flag, builds the `StoryContext`, then awaits
    `/api/ai/scene`.
  - After that it applies side effects: `setQuest` on the first scene, `setEncounter` on
    arrival, `markDilemmaPlanted`, the enrage announcement. Then it fires the image
    request.
- An effect (around line 490) requests actions as soon as scene text lands, guarded by
  `actionsRequestedRef`.
- `handleContinue` (around line 956) appends the story line, advances
  `currentPlayerIndex` and bumps `turnCounter`. The bump is deferred when a reward modal
  is pending; then the last reward handler bumps it. `turnCounter` drives `loadScene`.
- `buildStoryContext` reads `storyHistory`, `currentPlayer`, `encounter`, `quest` and
  `turnHistory.length` (via `currentEncounterPhase`) from the render closure. It reads
  heroes from the live store.
- Things that make a prefetch stale: reroll and Rally (new outcome text), Shield, Heal
  and potions (hero HP), monster victory (milestones and level-ups), loot equip and shop
  buys (gear), skill pick (skills). **The key compare at adoption is the single source of
  truth.** Restarting the prefetch on these events is only an optimisation.
- `loadScene` commits the dilemma (`markDilemmaPlanted`), the quest, the encounter and
  the enrage flag only after a scene arrives. A prefetch must never commit any of these.
  They happen in `loadScene` when the prefetched scene is adopted, exactly as today.
- `fetchScene` sets the shared `loadingScene` and `error` state, which the outcome screen
  reads (around lines 582, 1504, 1521). A background request must not touch them.
- Narration (TTS) is never prefetched: Google caps it near 100 requests a day.
- The dev server cannot be driven by the verify harness. Use a prod build (see the
  `verify` skill).

## File map

| File | Responsibility |
|---|---|
| Create `src/lib/game/prefetch.ts` | Pure: `turnSummaryLine`, `projectNextTurn`, `contextKey` |
| Create `tests/lib/game/prefetch.test.ts` | Unit tests for the above |
| Modify `src/hooks/use-game-ai.ts` | Add optional `AbortSignal` to `fetchScene`, `fetchActions`, `fetchImage`; add a `silent` option so a prefetch doesn't flip loading or error state |
| Create `src/hooks/use-scene-prefetch.ts` | Holds one in-flight prefetch: start, take, cancel |
| Modify `src/app/play/page.tsx` | `buildStoryContext` and `heroImageDescriptions` accept a projected snapshot; prefetch effect; `loadScene` takes a valid prefetch; stale-image guard |

---

### Task 1: Pure prefetch helpers

**Files:**
- Create: `src/lib/game/prefetch.ts`
- Test: `tests/lib/game/prefetch.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { turnSummaryLine, projectNextTurn, contextKey } from '@/lib/game/prefetch'
import type { StoryContext } from '@/types/ai'
import type { HeroState } from '@/types/game'

const hero = (over: Partial<HeroState> = {}): HeroState => ({
  playerId: 'p2', level: 2, xp: 6, hp: 0, maxHp: 7, knockedOut: true,
  gold: 3, skills: [], equipment: {}, ...over,
} as HeroState)

const ctx = (over: Partial<StoryContext> = {}): StoryContext => ({
  adventureStyle: 'fantasy',
  storyHistory: ['a', 'b'],
  characters: [{
    playerId: 'p1', playerName: 'Lucas', characterName: 'Lyn', class: 'ranger',
    rpg: { level: 2, hp: 5, maxHp: 7, knockedOut: false, skillNames: ['Ørneøje'], gearNames: ['bue'], petName: undefined },
  }],
  currentPlayerId: 'p1',
  language: 'da',
  encounterPhase: 'none',
  encounter: null,
  quest: { title: 'Q', goal: 'G', milestonesDone: 1 },
  isFirstScene: false,
  dilemma: false,
  ...over,
} as StoryContext)

describe('turnSummaryLine', () => {
  it('tags the outcome and keeps the prose', () => {
    expect(turnSummaryLine('Lyn', 'Skyd en pil', 'success', 'Pilen rammer.')).toBe('[Lyn · Skyd en pil · ✓] Pilen rammer.')
    expect(turnSummaryLine('Lyn', 'Skyd', 'partial', 'x')).toBe('[Lyn · Skyd · ~] x')
    expect(turnSummaryLine('Lyn', 'Skyd', 'failure', 'x')).toBe('[Lyn · Skyd · ✗] x')
  })
})

describe('projectNextTurn', () => {
  it('appends the line, caps history, advances the player and revives the next hero', () => {
    const out = projectNextTurn({
      storyHistory: Array.from({ length: 16 }, (_, i) => `l${i}`),
      pendingLine: 'new',
      maxHistory: 16,
      turnHistoryLength: 4,
      currentPlayerIndex: 0,
      playerIds: ['p1', 'p2', 'p3'],
      heroes: [hero({ playerId: 'p1', hp: 5, knockedOut: false }), hero()],
    })
    expect(out.storyHistory).toHaveLength(16)
    expect(out.storyHistory.at(-1)).toBe('new')
    expect(out.storyHistory[0]).toBe('l1')
    expect(out.turnHistoryLength).toBe(5)
    expect(out.currentPlayerIndex).toBe(1)
    expect(out.currentPlayerId).toBe('p2')
    const p2 = out.heroes.find(h => h.playerId === 'p2')!
    expect(p2.knockedOut).toBe(false)
    expect(p2.hp).toBeGreaterThan(0)
    expect(out.revivedPlayerId).toBe('p2')
  })

  it('wraps around and revives nobody when the next hero is standing', () => {
    const out = projectNextTurn({
      storyHistory: [], pendingLine: 'x', maxHistory: 16, turnHistoryLength: 0,
      currentPlayerIndex: 2, playerIds: ['p1', 'p2', 'p3'],
      heroes: [hero({ playerId: 'p1', hp: 4, knockedOut: false })],
    })
    expect(out.currentPlayerId).toBe('p1')
    expect(out.revivedPlayerId).toBeNull()
  })
})

describe('contextKey', () => {
  it('is equal for equal contexts', () => expect(contextKey(ctx())).toBe(contextKey(ctx())))

  it('changes with anything the scene or picture reads, gear included', () => {
    const a = ctx()
    const base = contextKey(a)
    const rpg = a.characters[0].rpg!
    const withRpg = (over: object) => ctx({ characters: [{ ...a.characters[0], rpg: { ...rpg, ...over } }] })
    expect(contextKey(ctx({ storyHistory: ['a', 'c'] }))).not.toBe(base)
    expect(contextKey(ctx({ currentPlayerId: 'p2' }))).not.toBe(base)
    expect(contextKey(ctx({ quest: { title: 'Q', goal: 'G', milestonesDone: 2 } }))).not.toBe(base)
    expect(contextKey(ctx({ encounterPhase: 'active' }))).not.toBe(base)
    expect(contextKey(withRpg({ hp: 4 }))).not.toBe(base)
    expect(contextKey(withRpg({ gearNames: ['sværd'] }))).not.toBe(base)
    expect(contextKey(withRpg({ skillNames: [] }))).not.toBe(base)
  })
})
```

Check the `HeroState` and `StoryContext` field names against `src/types/game.ts` and
`src/types/ai.ts` first. Adjust the fixtures, not the assertions, if a required field is
missing.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run tests/lib/game/prefetch.test.ts`
Expected: FAIL, `Cannot find module '@/lib/game/prefetch'`.

- [ ] **Step 3: Implement**

```ts
// The next page, written while the family is still reading this one.
// Everything here is pure: the play page projects what the game will look like
// after "Videre", keys it, and later checks the key still holds.
import type { StoryContext } from '@/types/ai'
import type { HeroState, OutcomeType } from '@/types/game'
import { reviveHero } from './rpg'

export function turnSummaryLine(characterName: string, actionText: string | undefined, outcome: OutcomeType | null, narrative: string): string {
  const tag = outcome === 'success' ? '✓' : outcome === 'partial' ? '~' : '✗'
  return `[${characterName} · ${actionText} · ${tag}] ${narrative}`
}

export interface ProjectInput {
  storyHistory: string[]
  pendingLine: string
  maxHistory: number
  turnHistoryLength: number
  currentPlayerIndex: number
  playerIds: string[]
  heroes: HeroState[]
}

export function projectNextTurn(input: ProjectInput) {
  const storyHistory = [...input.storyHistory, input.pendingLine].slice(-input.maxHistory)
  const currentPlayerIndex = (input.currentPlayerIndex + 1) % input.playerIds.length
  const currentPlayerId = input.playerIds[currentPlayerIndex]
  // Mirrors loadScene: a knocked-out hero gets up by themselves when their own turn starts
  const down = input.heroes.find(h => h.playerId === currentPlayerId && h.knockedOut)
  const heroes = down ? input.heroes.map(h => (h === down ? reviveHero(h) : h)) : input.heroes
  return {
    storyHistory,
    turnHistoryLength: input.turnHistoryLength + 1,
    currentPlayerIndex,
    currentPlayerId,
    heroes,
    revivedPlayerId: down ? currentPlayerId : null,
  }
}

// The whole context is the key: the scene prompt weaves in gear, powers and
// pets, and the picture shows them, so any change at all means a new page.
// buildStoryContext always builds fields in the same order, so JSON is stable.
export function contextKey(c: StoryContext): string {
  return JSON.stringify(c)
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run tests/lib/game/prefetch.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/game/prefetch.ts tests/lib/game/prefetch.test.ts
git commit -m "feat: pure helpers to project and key the next scene"
```

---

### Task 2: Abortable, silent AI fetches

**Files:**
- Modify: `src/hooks/use-game-ai.ts` (`fetchScene`, `fetchActions`, `fetchImage`)

- [ ] **Step 1: Add an options argument**

Give each of the three functions a last parameter `opts: { signal?: AbortSignal; silent?: boolean } = {}`:

- Pass `signal: opts.signal` to `fetch`.
- When `opts.silent` is true, skip every `setLoading…` and `setError` call. A prefetch
  must not show spinners or error banners for a page nobody asked for yet.
- In `catch`, an `AbortError` returns `null` without calling `setError`:

```ts
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') return null
  if (!opts.silent) setError(err instanceof Error ? err.message : 'Unknown error')
  return null
}
```

In `fetchScene` and `fetchActions`, change `return response.json()` to
`return await response.json()`. Without the `await`, an abort during the body read
escapes the `catch`, and the prefetch's promise chain rejects unhandled.

Existing callers pass nothing and behave exactly as before.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-game-ai.ts
git commit -m "feat: AI fetches take an abort signal and a silent mode"
```

---

### Task 3: The prefetch hook

**Files:**
- Create: `src/hooks/use-scene-prefetch.ts`

- [ ] **Step 1: Implement**

```ts
'use client'

import { useCallback, useRef } from 'react'
import type { GeneratedAction, GeneratedScene, StoryContext } from '@/types/ai'
import { contextKey } from '@/lib/game/prefetch'

export interface PrefetchStart {
  // Identifies the outcome this prefetch was built from. The same id twice is
  // a no-op, which also absorbs StrictMode's double-invoked effects.
  id: string
  context: StoryContext
  // Off on arrival, aftermath and enrage turns: today their actions are asked
  // for after loadScene has created or changed the encounter, and a prefetch
  // built before that would offer non-combat options in a fight.
  prefetchActions: boolean
  fetchScene: (c: StoryContext, o: { signal: AbortSignal; silent: true }) => Promise<GeneratedScene | null>
  fetchActions: (c: StoryContext, sceneText: string, o: { signal: AbortSignal; silent: true }) => Promise<GeneratedAction[] | null>
  fetchImage: (scene: GeneratedScene, signal: AbortSignal) => Promise<string | null>
}

export interface PrefetchTaken {
  scene: Promise<GeneratedScene | null>
  actions: Promise<GeneratedAction[] | null> | null
  image: Promise<string | null>
}

interface Entry {
  id: string
  key: string
  controller: AbortController
  scene: Promise<GeneratedScene | null>
  actions: Promise<GeneratedAction[] | null> | null
  image: Promise<string | null>
}

export function useScenePrefetch() {
  const entry = useRef<Entry | null>(null)

  const cancel = useCallback(() => {
    entry.current?.controller.abort()
    entry.current = null
  }, [])

  const start = useCallback((s: PrefetchStart) => {
    if (entry.current?.id === s.id) return
    cancel()
    const controller = new AbortController()
    const opts = { signal: controller.signal, silent: true as const }
    const scene = s.fetchScene(s.context, opts)
    const actions = s.prefetchActions
      ? scene.then(sc => (sc ? s.fetchActions(s.context, sc.narration, opts) : null))
      : null
    const image = scene.then(sc => (sc ? s.fetchImage(sc, controller.signal) : null))
    entry.current = {
      id: s.id,
      key: contextKey(s.context),
      controller,
      scene,
      actions,
      image,
    }
  }, [cancel])

  // Hands over the prefetch when it still fits the real context, else aborts it.
  // Aborting stops the browser waiting; the server may still finish its
  // Gemini call, so a discarded prefetch can cost one image.
  const take = useCallback((real: StoryContext): PrefetchTaken | null => {
    const e = entry.current
    if (!e || e.key !== contextKey(real)) { cancel(); return null }
    entry.current = null
    return { scene: e.scene, actions: e.actions, image: e.image }
  }, [cancel])

  // Stable identity, so it can sit in loadScene's dependency list
  return useMemo(() => ({ start, take, cancel }), [start, take, cancel])
}
```

Import `useMemo` alongside `useCallback` and `useRef`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `GeneratedScene` lacks `narration` or `imagePrompt`, check
`src/types/ai.ts` and use the real field names.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-scene-prefetch.ts
git commit -m "feat: hook that holds one in-flight next-scene prefetch"
```

---

### Task 4: Let the page build a projected context

**Files:**
- Modify: `src/app/play/page.tsx`
  - `currentEncounterPhase` (around line 198)
  - `buildStoryContext` (around line 212)
  - `heroImageDescriptions` (around line 264)
  - `loadScene`'s dilemma block (around lines 376-386)
  - `handleContinue` (around line 961)

- [ ] **Step 1: Thread an optional snapshot through**

1. `currentEncounterPhase(turnCount = turnHistory.length)`: use `turnCount` in place of
   `turnHistory.length`.
2. Add a type next to `buildStoryContext`:

   ```ts
   type ContextSnapshot = { storyHistory: string[]; turnHistoryLength: number; currentPlayerId: string; heroes: HeroState[] }
   ```

3. Change it to `buildStoryContext(snap?: ContextSnapshot)`:
   - `const liveHeroes = snap?.heroes ?? useGameStore.getState().heroes`
   - `storyHistory: (snap?.storyHistory ?? storyHistory).slice(-MAX_STORY_HISTORY)`
   - `currentPlayerId: snap?.currentPlayerId ?? currentPlayer?.id ?? ''`
   - `encounterPhase: currentEncounterPhase(snap?.turnHistoryLength)`
   - `isFirstScene: (snap?.storyHistory ?? storyHistory).length === 0 && !quest`
   - `dilemma: snap ? snapDilemma : dilemmaRef.current`. Add a second parameter
     `snapDilemma = false`, used only with a snapshot.
4. `heroImageDescriptions(heroesOverride?: HeroState[])`: use
   `heroesOverride ?? useGameStore.getState().heroes`.
5. Pull the dilemma decision out of `loadScene` into a function that **returns** the
   value and does not touch `dilemmaRef`:

   ```ts
   const decideDilemma = useCallback((phase: EncounterPhase, firstScene: boolean) => shouldPlantDilemma({
     milestonesDone: quest?.milestonesDone ?? 0,
     lastDilemmaAct: quest?.dilemmaAct ?? null,
     encounterPhase: phase,
     isFirstScene: firstScene,
     hasTheme: !!(quest?.theme ?? pickedThemeRef.current),
   }), [quest])
   ```

   `loadScene` then does `dilemmaRef.current = decideDilemma(currentEncounterPhase(), isFirstScene)`.
6. In `handleContinue`, replace the inline tag and summary with
   `turnSummaryLine(currentCharacter.name, selectedAction?.text, outcomeType, outcomeNarrative)`.

- [ ] **Step 2: Typecheck and run the unit tests**

Run: `npx tsc --noEmit && npx vitest run --exclude "tests/integration/**"`
Expected: no type errors, all tests pass. Behaviour is unchanged so far.

- [ ] **Step 3: Commit**

```bash
git add src/app/play/page.tsx
git commit -m "refactor: story context can be built for the projected next turn"
```

---

### Task 5: Start the prefetch when the outcome lands

**Files:**
- Modify: `src/app/play/page.tsx` (new effect next to the actions effect, around line 490)

- [ ] **Step 1: Add the effect**

Import `useScenePrefetch` from `@/hooks/use-scene-prefetch`, and `turnSummaryLine`,
`projectNextTurn` and `contextKey` from `@/lib/game/prefetch`.
Declare `const prefetch = useScenePrefetch()` near the top of the component, next to
`useGameAI()`, so `loadScene` (Task 6) can reach it. Add `prefetch` to `loadScene`'s
dependency list. The effect goes next to the actions effect:

```ts
// The outcome is written: start the next page while the family reads it.
// Skipped while a monster or boss victory is pending: the payday changes the
// milestones and levels the next scene is built on. The effect re-runs when
// heroes change (Shield, Heal, potions, shop), and a reroll writes a new
// narrative; both give a new key, so the old request is aborted. The id guard
// also absorbs StrictMode's double-invoked effect, so dev doesn't pay twice.
useEffect(() => {
  if (gamePhase !== 'outcome' || loadingOutcome || !outcomeNarrative) return
  if (monsterVictory || showVictory) { prefetch.cancel(); return }
  const line = turnSummaryLine(currentCharacter.name, selectedAction?.text, outcomeType, outcomeNarrative)
  const next = projectNextTurn({
    storyHistory, pendingLine: line, maxHistory: MAX_STORY_HISTORY,
    turnHistoryLength: turnHistory.length, currentPlayerIndex,
    playerIds: selectedPlayers.map(p => p.id),
    heroes: useGameStore.getState().heroes,
  })
  const snap = { storyHistory: next.storyHistory, turnHistoryLength: next.turnHistoryLength, currentPlayerId: next.currentPlayerId, heroes: next.heroes }
  const phase = currentEncounterPhase(next.turnHistoryLength)
  const dilemma = decideDilemma(phase, false)
  const context = buildStoryContext(snap, dilemma)
  const ordinaryTurn = phase === 'none' || (phase === 'active' && !context.encounter?.announceEnrage)
  prefetch.start({
    id: contextKey(context),
    context,
    prefetchActions: ordinaryTurn,
    fetchScene: (c, o) => fetchScene(c, o),
    fetchActions: (c, text, o) => fetchActions(c, text, o),
    fetchImage: (scene, signal) => getHeroPortraits()
      .then(portraits => fetchImage(scene.imagePrompt, adventureStyle, heroImageDescriptions(next.heroes), portraits, { signal, silent: true })),
  })
}, [gamePhase, loadingOutcome, outcomeNarrative, heroes, monsterVictory, showVictory]) // eslint-disable-line react-hooks/exhaustive-deps

// Leaving the page drops whatever is in flight
useEffect(() => () => prefetch.cancel(), []) // eslint-disable-line react-hooks/exhaustive-deps
```

Use the real name of the outcome-loading flag from `useGameAI()`. Check how the page
destructures it; it may be `loadingOutcome`.

`heroImageDescriptions(next.heroes)` matters: it paints the next hero standing, since
`loadScene` will revive them before the picture is shown. The projection appends
`turnHistory` too (`turnHistoryLength + 1`). That count is what flips
`arriving-monster` and `arriving-boss`, so without it every spawn turn would mismatch.

The effect only **requests**. It never sets `dilemmaRef`, never calls
`markDilemmaPlanted`, and never touches quest or encounter state. `loadScene` does all
of that when it adopts the scene.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/play/page.tsx
git commit -m "feat: write the next scene in the background once the outcome is known"
```

---

### Task 6: `loadScene` takes the prefetch

**Files:**
- Modify: `src/app/play/page.tsx` (`loadScene`, around lines 388-436; the actions effect, around 489-495)

- [ ] **Step 1: Use the prefetch when it fits**

Add next to the other refs and state:

```ts
// Every loadScene gets a number; late results from an older scene are dropped
const sceneSeqRef = useRef(0)
// Prefetched actions still on their way: the options slot shows "thinking"
const [awaitingPrefetchedActions, setAwaitingPrefetchedActions] = useState(false)
// Bumped to make the actions effect ask again (its guard ignores a same-text scene)
const [actionsRetryTick, setActionsRetryTick] = useState(0)
```

Move the `actionsRequestedRef` declaration above `loadScene` so it is in scope.

At the very top of `loadScene`, before the reset block, take a number. In the reset
block, clear the waiting flag:

```ts
const sceneSeq = ++sceneSeqRef.current
// ...existing resets...
setAwaitingPrefetchedActions(false)
```

The revive and the dilemma decision already run before `buildStoryContext()`. Replace
`const scene = await fetchScene(context)` with:

```ts
const taken = prefetch.take(context)
const prefetched = taken ? await taken.scene : null
// A failed or empty prefetch falls back to today's request
const usedPrefetch = !!prefetched
const scene = prefetched ?? await fetchScene(context)
if (sceneSeqRef.current !== sceneSeq) return
```

The key includes the dilemma flag, so a match means the prefetch was built with the same
value `loadScene` just put in `dilemmaRef.current`. The side-effect block (dilemma
marking, quest, encounter, enrage) runs unchanged on the adopted scene. This is the only
place the prefetch is consumed: all five `setTurnCounter` sites lead here.

Inside `if (scene) { ... }`, after `setGamePhase('scene')`, hand over the prefetched
actions when there are any:

```ts
if (usedPrefetch && taken?.actions) {
  actionsRequestedRef.current = scene.narration
  setAwaitingPrefetchedActions(true)
  taken.actions.then(a => {
    if (sceneSeqRef.current !== sceneSeq) return
    setAwaitingPrefetchedActions(false)
    if (a) setActions(a)
    // Ask again through the effect, which reads the current scene and context
    else { actionsRequestedRef.current = null; setActionsRetryTick(t => t + 1) }
  })
}
```

When there are no prefetched actions (arrival, aftermath and enrage turns, or no
prefetch), do nothing: the actions effect asks as today.

Replace the image block so it uses the prefetched image only when the prefetched scene
was used, and never paints onto a newer scene:

```ts
const image = usedPrefetch && taken
  ? taken.image
  : getHeroPortraits().then(portraits => fetchImage(scene.imagePrompt, adventureStyle, heroImageDescriptions(), portraits))
image.then(url => { if (url && sceneSeqRef.current === sceneSeq) setSceneImageUrl(url) })
```

Then two small changes outside `loadScene`:

- Add `actionsRetryTick` to the actions effect's dependency list (around line 495).
- In the JSX, show the "thinking" state for actions when
  `loadingActions || awaitingPrefetchedActions` (around lines 1538-1553), so the options
  slot is never blank.

- [ ] **Step 2: Typecheck and run the unit tests**

Run: `npx tsc --noEmit && npx vitest run --exclude "tests/integration/**"`
Expected: no type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/play/page.tsx
git commit -m "feat: the next scene appears at once when the prefetch still fits"
```

---

### Task 7: Drive it in the real app

**Files:** none in the repo. Use the `verify` skill's driver in the session scratchpad.

- [ ] **Step 1: Build and serve**

Run: `npx next build && npx next start -p 3112` (in the background)

- [ ] **Step 2: Stub the AI with real delays**

In the CDP driver, stub `*/api/ai/scene` with a 4 s delay and a different narration on
every call (the actions guard needs that). Stub `*/api/ai/image` with a 6 s delay,
`*/api/ai/actions` with 2 s, and `*/api/ai/outcome` with 3 s.

- [ ] **Step 3: Check these paths**

1. **Plain turn.** Roll, wait for the outcome, wait about 5 s, then click "Videre". The
   next scene text must be visible within 300 ms. Count the requests: one scene call for
   that turn, not two.
2. **Reroll.** Roll, use "Slå igen" before "Videre", then click "Videre". The scene shown
   must come from a request sent after the reroll (check the request order in the stub log).
3. **Loot equip.** Force a chest and equip the item. The prefetch is discarded, and the
   next scene is requested fresh after the chest closes (today's behaviour).
4. **Spawn turn.** Seed the turn count so the next scene is `arriving-monster`. The
   prefetched scene is used, the encounter appears exactly once, and the actions are
   asked for after the encounter exists. Check that they are combat options (the
   actions request body has `encounterPhase: 'active'`).
5. **Failed prefetch.** Make the stub fail the first scene call. "Videre" falls back to
   a fresh request, and the picture and the options both arrive.
6. **No double spend.** In the stub log, every turn has at most one scene request and one
   image request unless something changed.

- [ ] **Step 4: Full suite**

Run: `npx vitest run --exclude "tests/integration/**" && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 5: Ship**

Push the branch, open the PR, and squash-merge it only when the family is not playing.
Say in the PR what was not checked: the live Gemini timings.
