# Design Spec: Play Loop AI Integration

**Date:** 2026-04-04
**Status:** Approved for implementation
**Goal:** Replace mock data in the play page with real Gemini 3 Flash AI calls to enable a playable end-to-end adventure session.

---

## 1. Problem

The play page (`src/app/play/page.tsx`) uses hardcoded mock data (`MOCK_SCENE`, `MOCK_ACTIONS`, static outcome strings). The AI integration code exists (`src/lib/ai/*`, `src/hooks/use-game-ai.ts`, `src/app/api/ai/*/route.ts`) but is never called. The game is not playable.

## 2. Scope

### In scope

- Update Gemini model from `gemini-2.5-flash` to `gemini-3.0-flash`
- Wire `useGameAI` hook into the play page, replacing all mock data
- Build story context accumulation between turns (capped at ~10 turns)
- Use in-app dice rolling with results feeding into AI outcome generation
- Use `sceneFit` from AI-generated actions in outcome calculation (replacing hardcoded `'okay'`)
- Handle AI errors with retry UI via existing `error-message` component

### Out of scope

- TTS (text-to-speech) — parent reads narration aloud
- Image generation — no scene images
- Supabase / data persistence — Zustand + localStorage only
- Authentication — no login
- Language support — English only
- New UI components — existing components used as-is

## 3. Architecture

No architectural changes. The existing three-layer design stays:

```
Play Page → useGameAI hook → API Routes → AI lib functions → Gemini API
```

Data flow per turn:

```
1. Play page calls useGameAI.fetchScene(storyContext)
2. Hook POSTs to /api/ai/scene
3. API route calls generateScene() from src/lib/ai/story.ts
4. Gemini 3 Flash returns GeneratedScene JSON
5. Play page displays narration, transitions to action phase
6. Same flow for fetchActions() and fetchOutcome()
```

## 4. Changes by File

### `src/lib/ai/gemini.ts`

Update model ID from `gemini-2.5-flash` to `gemini-3.0-flash` in both `textModel` and `jsonModel`.

### `src/app/play/page.tsx`

This is the primary change. The play page must:

1. **Remove** `MOCK_SCENE`, `MOCK_ACTIONS` constants, the local `ActionOption` interface (lines 17-21), and the mock `useEffect` (lines 23-71). Use `GeneratedAction` from `@/types/ai` instead.
2. **Import** `useGameAI` hook
3. **Add** story context state: an array of turn summaries (`TurnRecord[]`) that accumulates as the game progresses
4. **Build** a `StoryContext` object from game store state (players, characters, adventure style, story history) on each turn
5. **Replace** mock scene loading with `fetchScene(storyContext)` call — this must trigger on each new turn (e.g., keyed on `currentPlayerIndex` or called from `handleContinue`), not just on mount
6. **Replace** `MOCK_ACTIONS` usage in `ActionPicker` with `fetchActions(storyContext, currentScene)` call
7. **Replace** hardcoded outcome narratives with `fetchOutcome(storyContext, action, stat, outcome, scene)` call
8. **Use** `sceneFit` from the AI-generated action in `calculateOutcome()` instead of hardcoded `'okay'`
9. **Append** completed turn data to story context after each outcome
10. **Cap** story history at last ~10 entries to avoid token bloat
11. **Show** loading states from `useGameAI` (which already exposes `loadingScene`, `loadingActions`, `loadingOutcome`)
12. **Show** error state with retry option when AI calls fail

### `src/stores/game-store.ts`

The store already has `storyHistory: string[]`, `turnHistory: TurnRecord[]`, and `updateAdventureState()`. These fields will be used to persist story context across turns within a session. The `resetAdventure()` function clears them for a new adventure.

No changes needed to the store itself — the play page will use the existing interface.

### API routes (`src/app/api/ai/scene/route.ts`, `actions/route.ts`, `outcome/route.ts`)

No changes needed. These routes already correctly receive POST data and call the corresponding lib functions. They inherit the model change from `gemini.ts`.

### AI lib files (`src/lib/ai/story.ts`, `actions.ts`, `outcomes.ts`)

No changes needed. The prompts and JSON schemas are already well-structured for generating scenes, actions, and outcomes. They inherit the model change from `gemini.ts`.

### Files NOT touched

- `src/lib/ai/tts.ts` — broken, out of scope
- `src/lib/ai/images.ts` — broken, out of scope
- `src/app/api/ai/tts/route.ts` — out of scope
- `src/app/api/ai/image/route.ts` — out of scope
- `src/lib/supabase/*` — out of scope
- All UI components (`src/components/game/*`) — used as-is
- `src/lib/game/mechanics.ts`, `classes.ts`, `rotation.ts` — used as-is

## 5. Turn Loop Detail

```
SCENE PHASE
  → Build StoryContext from game store (adventureStyle, characters, storyHistory, currentPlayerId)
  → fetchScene(storyContext) → display narration
  → User taps "Choose Action"

ACTION PHASE
  → fetchActions(storyContext, currentScene) → display 3 action cards
  → User picks an action

DICE PHASE
  → In-app dice roll animation (existing DiceRoller component)
  → calculateOutcome({ sceneFit: action.sceneFit, statValue, diceRoll, difficulty })
  → Result determines outcome type (success/partial/failure)

OUTCOME PHASE
  → fetchOutcome(storyContext, actionChosen, stat, outcomeType, currentScene)
  → Display AI-generated outcome narrative
  → Append turn record to turnHistory and scene summary to storyHistory
  → User taps "Continue"
  → Rotate to next player → loop back to SCENE PHASE
```

## 6. Story Context Management

Each completed turn produces a summary string appended to `storyHistory`:

```
"[PlayerName] chose to [action]. Using [stat], they [succeeded/partially succeeded/failed]. [brief outcome summary]"
```

This array is passed to `generateScene()` via `StoryContext.storyHistory`. The existing prompt in `story.ts` already slices to the last 5 entries (`context.storyHistory.slice(-5)`). We'll increase this to 10 in the play page before passing it, giving the AI more context for narrative coherence while staying within token limits.

The `turnHistory` array in the game store keeps the full structured data (`TurnRecord[]`) for potential future use (session recaps, etc.) but only `storyHistory` (the string summaries) is sent to the AI.

## 7. Error Handling

- If any AI call fails, `useGameAI` sets `error` state with the error message
- Play page displays the existing `ErrorMessage` component with the error text and a "Retry" button
- Retry re-invokes the failed call with the same parameters
- The game phase does not advance on error — the user stays on the current phase until the call succeeds or they quit

## 8. Success Criteria

- A family can start a new adventure and play through multiple turns with AI-generated content
- Each turn produces a unique, contextual scene that builds on previous events
- Actions are relevant to the current scene and character
- Outcomes reflect the dice roll and chosen action
- The game loop continues indefinitely until the family chooses to pause/quit
- Page refresh preserves game state (via existing localStorage persistence)
