# Family Quest Engagement — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hero progression (XP + levels), a once-per-level class signature move, and off-turn co-op assist to the play loop, so the game accumulates and both kids stay engaged.

**Architecture:** All game math is deterministic pure functions (new `progression.ts`, extended `mechanics.ts`/`classes.ts`) covered by unit tests. Progression persists as four new fields on the existing `Character` object, which already snapshots per adventure slot — no new storage layer. The play page (`play/page.tsx`) is the orchestrator that wires these into the existing scene→action→dice→outcome→continue loop. Screen-light UI: a level/XP badge in the turn header, two contextual dice-phase buttons, and one celebratory level-up overlay.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, zustand (+persist/localStorage), Gemini via `/api/ai/*` routes, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-03-family-quest-engagement-design.md`

**Working directory:** All paths are relative to `family-quest/` (the git repo — commits happen here). Run all commands from `family-quest/`.

---

## File Structure

**Create:**
- `src/lib/game/progression.ts` — XP/level/signature pure logic + `PRIMARY_STAT`, `SIGNATURE_MOVES`, `ASSIST_BONUS` constants.
- `src/components/game/level-up-celebration.tsx` — the level-up overlay.
- `src/components/game/assist-button.tsx` — off-turn "Hjælp [navn]!" button (presentational).
- `src/components/game/signature-move-button.tsx` — signature-move button (presentational).
- `tests/lib/game/progression.test.ts`
- Test additions in `tests/stores/*.test.ts`, `tests/lib/game/classes.test.ts`, `tests/lib/game/mechanics.test.ts`, `tests/lib/ai/outcomes.test.ts`.

**Modify:**
- `src/types/game.ts` — add `LootItem`, `SignatureMove` types.
- `src/stores/game-store.ts` — `Character` fields, `CharacterInput`, `setCharacter` merge, new `updateCharacter` action, persist `version` 1→2 + `migrate`.
- `src/lib/game/classes.ts` — add `getCharacterStats(class, level)`.
- `src/lib/game/mechanics.ts` — add `assistBonus` to the formula.
- `src/lib/ai/outcomes.ts` — extract `buildOutcomePrompt`, add assist/signature fields.
- `src/hooks/use-game-ai.ts` — thread assist/signature params through `fetchOutcome`.
- `src/components/game/player-turn.tsx` — level badge + XP bar.
- `src/components/game/outcome-display.tsx` — handle no-roll signature outcome.
- `src/app/play/page.tsx` — orchestrate assist, signature, XP grant, level-up celebration; use `getCharacterStats`.

**Kid-facing strings are Danish; code identifiers and UI chrome stay English.**

---

## Task 1: Data model — Character progression fields

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/stores/game-store.ts`
- Test: `tests/stores/character-progression.test.ts` (create)

- [ ] **Step 1: Add supporting types**

In `src/types/game.ts`, append:

```ts
export interface LootItem {
  id: string
  name: string
  emoji: string
  kind: 'trophy' | 'boon'
  bonus?: { stat: Stat; amount: number }
}

export interface SignatureMove {
  name: string      // Danish, e.g. "Skjoldstorm"
  emoji: string
  description: string // Danish, short
}
```

- [ ] **Step 2: Write the failing store test**

Create `tests/stores/character-progression.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/game-store'

const reset = () => useGameStore.setState({ characters: [] })

describe('setCharacter progression defaults', () => {
  beforeEach(reset)

  it('gives a new character starting progression', () => {
    useGameStore.getState().setCharacter({ playerId: 'p1', name: 'Bjorn', class: 'warrior', gender: 'male' })
    const c = useGameStore.getState().characters.find(c => c.playerId === 'p1')!
    expect(c.level).toBe(1)
    expect(c.xp).toBe(0)
    expect(c.signatureReady).toBe(true)
    expect(c.inventory).toEqual([])
  })

  it('preserves existing progression when the character is edited', () => {
    const s = useGameStore.getState()
    s.setCharacter({ playerId: 'p1', name: 'Bjorn', class: 'warrior', gender: 'male' })
    useGameStore.getState().updateCharacter('p1', { level: 4, xp: 3, signatureReady: false })
    // Re-edit identity (e.g. rename) — must NOT reset progression
    useGameStore.getState().setCharacter({ playerId: 'p1', name: 'Bjorn den Modige', class: 'warrior', gender: 'male' })
    const c = useGameStore.getState().characters.find(c => c.playerId === 'p1')!
    expect(c.name).toBe('Bjorn den Modige')
    expect(c.level).toBe(4)
    expect(c.xp).toBe(3)
    expect(c.signatureReady).toBe(false)
  })

  it('updateCharacter merges a partial update', () => {
    useGameStore.getState().setCharacter({ playerId: 'p2', name: 'Mira', class: 'wizard', gender: 'female' })
    useGameStore.getState().updateCharacter('p2', { xp: 2 })
    const c = useGameStore.getState().characters.find(c => c.playerId === 'p2')!
    expect(c.xp).toBe(2)
    expect(c.level).toBe(1) // untouched
  })
})
```

- [ ] **Step 3: Run test — verify it fails**

Run: `npm run test:run -- tests/stores/character-progression.test.ts`
Expected: FAIL (Character has no `level`; `updateCharacter` undefined).

- [ ] **Step 4: Implement the model changes**

In `src/stores/game-store.ts`:

Update the `Character` interface and add a `CharacterInput` alias:

```ts
import type { CharacterClass, AdventureStyle, Difficulty, TurnRecord, LootItem } from '@/types/game'

interface Character {
  playerId: string
  name: string
  class: CharacterClass
  gender: 'male' | 'female' | 'neutral'
  level: number
  xp: number
  signatureReady: boolean
  inventory: LootItem[]
}

// The identity fields character creation supplies; progression is managed by the store.
type CharacterInput = Pick<Character, 'playerId' | 'name' | 'class' | 'gender'>
```

Change `setCharacter` in the `GameStore` interface to `setCharacter: (character: CharacterInput) => void` and add `updateCharacter: (playerId: string, updates: Partial<Character>) => void`.

Replace the `setCharacter` implementation with a merge that preserves progression, and add `updateCharacter`:

```ts
setCharacter: (character) => set((state) => {
  const existing = state.characters.find(c => c.playerId === character.playerId)
  const merged: Character = {
    level: existing?.level ?? 1,
    xp: existing?.xp ?? 0,
    signatureReady: existing?.signatureReady ?? true,
    inventory: existing?.inventory ?? [],
    ...character,
  }
  return {
    characters: [
      ...state.characters.filter(c => c.playerId !== character.playerId),
      merged,
    ],
  }
}),
updateCharacter: (playerId, updates) => set((state) => ({
  characters: state.characters.map(c =>
    c.playerId === playerId ? { ...c, ...updates } : c
  ),
})),
```

- [ ] **Step 5: Run test — verify it passes**

Run: `npm run test:run -- tests/stores/character-progression.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/game.ts src/stores/game-store.ts tests/stores/character-progression.test.ts
git commit -m "feat: add hero progression fields to Character model"
```

---

## Task 2: Persistence migration v1 → v2

Existing localStorage (Steven's device) and every saved adventure snapshot must gain the new fields without crashing.

**Files:**
- Modify: `src/stores/game-store.ts` (persist `version` + `migrate`)
- Test: `tests/stores/migration.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/stores/migration.test.ts`. The `migrate` function is passed to `persist`; test it directly by importing the store module and exercising a helper. To make it testable, export a pure `migrateV1toV2` from the store module.

```ts
import { describe, it, expect } from 'vitest'
import { migrateV1toV2 } from '@/stores/game-store'

describe('migrateV1toV2', () => {
  it('backfills progression on live characters', () => {
    const state = {
      characters: [{ playerId: 'p1', name: 'Bjorn', class: 'warrior', gender: 'male' }],
      savedAdventures: [],
    }
    const out = migrateV1toV2(state)
    expect(out.characters[0]).toMatchObject({ level: 1, xp: 0, signatureReady: true, inventory: [] })
  })

  it('backfills progression on characters inside saved adventure snapshots', () => {
    const state = {
      characters: [],
      savedAdventures: [{
        id: 'a1', name: 'Skoven', savedAt: 1,
        snapshot: { characters: [{ playerId: 'p1', name: 'Mira', class: 'wizard', gender: 'female' }] },
      }],
    }
    const out = migrateV1toV2(state)
    expect(out.savedAdventures[0].snapshot.characters[0]).toMatchObject({ level: 1, xp: 0, signatureReady: true, inventory: [] })
  })

  it('does not clobber characters that already have progression', () => {
    const state = {
      characters: [{ playerId: 'p1', name: 'Bjorn', class: 'warrior', gender: 'male', level: 5, xp: 2, signatureReady: false, inventory: [] }],
      savedAdventures: [],
    }
    const out = migrateV1toV2(state)
    expect(out.characters[0].level).toBe(5)
    expect(out.characters[0].xp).toBe(2)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/stores/migration.test.ts`
Expected: FAIL (`migrateV1toV2` not exported).

- [ ] **Step 3: Implement the migration**

In `src/stores/game-store.ts`, add an exported helper above `useGameStore` and wire it into `persist`:

```ts
const withProgression = (c: any): Character => ({
  level: 1, xp: 0, signatureReady: true, inventory: [],
  ...c,
})

// Exported for unit testing.
export const migrateV1toV2 = (state: any) => ({
  ...state,
  characters: (state.characters ?? []).map(withProgression),
  savedAdventures: (state.savedAdventures ?? []).map((a: any) => ({
    ...a,
    snapshot: { ...a.snapshot, characters: (a.snapshot?.characters ?? []).map(withProgression) },
  })),
})
```

Update the `persist` options: bump `version: 1` to `version: 2`, and extend `migrate`:

```ts
version: 2,
migrate: (persisted, version) => {
  let state = persisted as any
  if (version < 1) {
    state = { ...state, language: 'da', dicePreference: 'physical' }
  }
  if (version < 2) {
    state = migrateV1toV2(state)
  }
  return state
},
```

Note: `withProgression` spreads `...c` last so existing progression (Task 2 test 3) is preserved.

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test:run -- tests/stores/migration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/stores/game-store.ts tests/stores/migration.test.ts
git commit -m "feat: migrate persisted state to v2 with progression backfill"
```

---

## Task 3: Progression pure logic

**Files:**
- Create: `src/lib/game/progression.ts`
- Test: `tests/lib/game/progression.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/game/progression.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  xpForOutcome, xpForNextLevel, applyXpAndLevelUp,
  PRIMARY_STAT, SIGNATURE_MOVES, ASSIST_BONUS,
} from '@/lib/game/progression'

describe('xpForOutcome', () => {
  it('grants 3 / 2 / 1 for success / partial / failure', () => {
    expect(xpForOutcome('success')).toBe(3)
    expect(xpForOutcome('partial')).toBe(2)
    expect(xpForOutcome('failure')).toBe(1)
  })
})

describe('xpForNextLevel', () => {
  it('scales as level * 5', () => {
    expect(xpForNextLevel(1)).toBe(5)
    expect(xpForNextLevel(2)).toBe(10)
  })
})

describe('PRIMARY_STAT', () => {
  it('maps each class to its primary stat', () => {
    expect(PRIMARY_STAT).toEqual({ warrior: 'strength', wizard: 'magic', rogue: 'agility', ranger: 'heart' })
  })
})

describe('SIGNATURE_MOVES', () => {
  it('defines one Danish-named move per class', () => {
    expect(SIGNATURE_MOVES.warrior.name).toBe('Skjoldstorm')
    expect(SIGNATURE_MOVES.wizard.name).toBe('Tryldeglimt')
    expect(SIGNATURE_MOVES.rogue.name).toBe('Skyggespring')
    expect(SIGNATURE_MOVES.ranger.name).toBe('Ørneblik')
  })
})

describe('applyXpAndLevelUp', () => {
  const base = { level: 1, xp: 0, signatureReady: true }

  it('adds XP without leveling when below threshold', () => {
    const r = applyXpAndLevelUp({ ...base, xp: 1 }, 3) // 1+3=4 < 5
    expect(r.leveledUp).toBe(false)
    expect(r.progression).toMatchObject({ level: 1, xp: 4 })
  })

  it('levels up and carries the remainder', () => {
    const r = applyXpAndLevelUp({ ...base, xp: 3 }, 3) // 3+3=6, threshold 5 -> level 2, xp 1
    expect(r.leveledUp).toBe(true)
    expect(r.newLevel).toBe(2)
    expect(r.progression).toMatchObject({ level: 2, xp: 1, signatureReady: true })
  })

  it('recharges the signature move on level-up', () => {
    const r = applyXpAndLevelUp({ level: 2, xp: 9, signatureReady: false }, 3) // 9+3=12, threshold 10 -> level 3, xp 2
    expect(r.leveledUp).toBe(true)
    expect(r.progression.signatureReady).toBe(true)
  })

  it('does not recharge or level when no level-up occurs', () => {
    const r = applyXpAndLevelUp({ level: 2, xp: 0, signatureReady: false }, 2)
    expect(r.leveledUp).toBe(false)
    expect(r.progression.signatureReady).toBe(false)
  })
})

describe('ASSIST_BONUS', () => {
  it('is +2', () => { expect(ASSIST_BONUS).toBe(2) })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/lib/game/progression.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `progression.ts`**

Create `src/lib/game/progression.ts`:

```ts
import type { CharacterClass, Stat, OutcomeType, SignatureMove } from '@/types/game'

export const ASSIST_BONUS = 2

const XP_BY_OUTCOME: Record<OutcomeType, number> = { success: 3, partial: 2, failure: 1 }

export function xpForOutcome(outcome: OutcomeType): number {
  return XP_BY_OUTCOME[outcome]
}

export function xpForNextLevel(level: number): number {
  return level * 5
}

export const PRIMARY_STAT: Record<CharacterClass, Stat> = {
  warrior: 'strength',
  wizard: 'magic',
  rogue: 'agility',
  ranger: 'heart',
}

export const SIGNATURE_MOVES: Record<CharacterClass, SignatureMove> = {
  warrior: { name: 'Skjoldstorm', emoji: '⚔️', description: 'Et uimodståeligt angreb der altid rammer.' },
  wizard:  { name: 'Tryldeglimt', emoji: '🧙', description: 'En besværgelse der altid virker.' },
  rogue:   { name: 'Skyggespring', emoji: '🗡️', description: 'Et lynhurtigt træk ingen kan stoppe.' },
  ranger:  { name: 'Ørneblik', emoji: '🏹', description: 'Et perfekt sigte der aldrig fejler.' },
}

export interface Progression {
  level: number
  xp: number
  signatureReady: boolean
}

export interface LevelUpResult {
  progression: Progression
  leveledUp: boolean
  newLevel: number
}

// Grant XP and apply as many level-ups as the total crosses (carrying remainder).
export function applyXpAndLevelUp(p: Progression, gained: number): LevelUpResult {
  let { level, xp, signatureReady } = p
  xp += gained
  let leveledUp = false
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level)
    level += 1
    signatureReady = true
    leveledUp = true
  }
  return { progression: { level, xp, signatureReady }, leveledUp, newLevel: level }
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test:run -- tests/lib/game/progression.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game/progression.ts tests/lib/game/progression.test.ts
git commit -m "feat: add XP/level/signature progression logic"
```

---

## Task 4: Derived stats (base + level bonus)

**Files:**
- Modify: `src/lib/game/classes.ts`
- Modify: `src/app/play/page.tsx` (call site)
- Test: `tests/lib/game/classes.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/game/classes.test.ts`:

```ts
import { getCharacterStats } from '@/lib/game/classes'

describe('getCharacterStats', () => {
  it('returns base stats at level 1', () => {
    expect(getCharacterStats('warrior', 1)).toEqual({ strength: 5, magic: 1, agility: 2, heart: 4 })
  })
  it('raises only the primary stat by (level - 1)', () => {
    expect(getCharacterStats('warrior', 3)).toEqual({ strength: 7, magic: 1, agility: 2, heart: 4 })
  })
  it('uses heart as the ranger primary', () => {
    expect(getCharacterStats('ranger', 2)).toEqual({ strength: 2, magic: 2, agility: 4, heart: 5 })
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/lib/game/classes.test.ts`
Expected: FAIL (`getCharacterStats` not exported).

- [ ] **Step 3: Implement `getCharacterStats`**

In `src/lib/game/classes.ts`, import the primary map and add the function (keep existing `getClassStats` for base lookups):

```ts
import { PRIMARY_STAT } from './progression'

export function getCharacterStats(characterClass: CharacterClass, level: number): Record<Stat, number> {
  const base = { ...CLASS_DEFINITIONS[characterClass].stats }
  const primary = PRIMARY_STAT[characterClass]
  base[primary] += Math.max(0, level - 1)
  return base
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test:run -- tests/lib/game/classes.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the play page call site**

In `src/app/play/page.tsx` `handleDiceRoll`, replace:

```ts
const stats = getClassStats(currentCharacter.class)
```

with:

```ts
const stats = getCharacterStats(currentCharacter.class, currentCharacter.level)
```

Update the import at the top from `getClassStats` to `getCharacterStats`.

- [ ] **Step 6: Verify build compiles**

Run: `npm run test:run` (whole suite) — Expected: all green. (Full typecheck happens in Task 10.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/game/classes.ts src/app/play/page.tsx tests/lib/game/classes.test.ts
git commit -m "feat: derive character stats from class + level"
```

---

## Task 5: Assist bonus in the outcome formula

**Files:**
- Modify: `src/lib/game/mechanics.ts`
- Test: `tests/lib/game/mechanics.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/game/mechanics.test.ts`:

```ts
describe('calculateOutcome with assist', () => {
  it('adds the assist bonus to the combined score', () => {
    const withoutAssist = calculateOutcome({ sceneFit: 'okay', statValue: 2, diceRoll: 3, difficulty: 'medium' })
    const withAssist = calculateOutcome({ sceneFit: 'okay', statValue: 2, diceRoll: 3, difficulty: 'medium', assistBonus: 2 })
    expect(withoutAssist.combinedScore).toBe(6)
    expect(withAssist.combinedScore).toBe(8)
  })
  it('treats a missing assistBonus as 0', () => {
    const r = calculateOutcome({ sceneFit: 'good', statValue: 5, diceRoll: 3, difficulty: 'medium' })
    expect(r.combinedScore).toBe(10)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/lib/game/mechanics.test.ts`
Expected: FAIL (`assistBonus` not accepted / not added).

- [ ] **Step 3: Implement**

In `src/lib/game/mechanics.ts`, add `assistBonus?: number` to `SuccessCalculation` and include it:

```ts
export interface SuccessCalculation {
  sceneFit: SceneFit
  statValue: number
  diceRoll: number
  difficulty: Difficulty
  assistBonus?: number
}
```

In `calculateOutcome`:

```ts
const combinedScore = sceneFitBonus + calc.statValue + calc.diceRoll + (calc.assistBonus ?? 0)
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test:run -- tests/lib/game/mechanics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game/mechanics.ts tests/lib/game/mechanics.test.ts
git commit -m "feat: add co-op assist bonus to outcome calculation"
```

---

## Task 6: Outcome narrative — thread assist & signature

The AI narration should mention teamwork and the signature move. Extract a pure `buildOutcomePrompt` so it is testable.

**Files:**
- Modify: `src/lib/ai/outcomes.ts`
- Modify: `src/hooks/use-game-ai.ts`
- Test: `tests/lib/ai/outcomes.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/ai/outcomes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildOutcomePrompt } from '@/lib/ai/outcomes'

const baseCtx = {
  storyContext: {
    adventureStyle: 'realistic' as const,
    storyHistory: [],
    characters: [{ playerId: 'p1', playerName: 'Lucas', characterName: 'Bjorn', class: 'warrior' as const }],
    currentPlayerId: 'p1',
    language: 'da' as const,
  },
  actionChosen: 'Jeg hugger døren ind',
  stat: 'strength' as const,
  outcome: 'success' as const,
  currentScene: 'En låst dør blokerer vejen.',
}

describe('buildOutcomePrompt', () => {
  it('mentions the helper when an assist happened', () => {
    const prompt = buildOutcomePrompt({ ...baseCtx, assistHelperName: 'Mason' })
    expect(prompt).toContain('Mason')
  })
  it('mentions the signature move when it was used', () => {
    const prompt = buildOutcomePrompt({ ...baseCtx, usedSignature: true, signatureName: 'Skjoldstorm' })
    expect(prompt).toContain('Skjoldstorm')
  })
  it('omits assist/signature lines when not provided', () => {
    const prompt = buildOutcomePrompt(baseCtx)
    expect(prompt).not.toContain('hjalp')
    expect(prompt).not.toContain('særlige kraft')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/lib/ai/outcomes.test.ts`
Expected: FAIL (`buildOutcomePrompt` not exported).

- [ ] **Step 3: Refactor `outcomes.ts` to expose a pure prompt builder**

In `src/lib/ai/outcomes.ts`, extend the `OutcomeContext` interface with optional fields and split out the prompt:

```ts
interface OutcomeContext {
  storyContext: StoryContext
  actionChosen: string
  stat: Stat
  outcome: OutcomeType
  currentScene: string
  assistHelperName?: string
  usedSignature?: boolean
  signatureName?: string
}

export function buildOutcomePrompt(context: OutcomeContext): string {
  const currentCharacter = context.storyContext.characters.find(
    c => c.playerId === context.storyContext.currentPlayerId
  )

  // Meta-instructions stay ENGLISH (like every other prompt builder); the model still
  // writes the narration in the family's language via languageInstruction() above.
  const assistLine = context.assistHelperName
    ? `\nA friend named ${context.assistHelperName} helped out — weave the teamwork into the story.`
    : ''
  const signatureLine = context.usedSignature && context.signatureName
    ? `\n${currentCharacter?.characterName} used their special power "${context.signatureName}" — make the moment heroic and spectacular.`
    : ''

  return `You are a D&D dungeon master narrating an outcome.

${languageInstruction(context.storyContext.language, 'text')}

Adventure Style: ${context.storyContext.adventureStyle}
Current Scene: ${context.currentScene}
Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${OUTCOME_INSTRUCTIONS[context.outcome]}${assistLine}${signatureLine}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.`
}

export async function generateOutcome(context: OutcomeContext): Promise<string> {
  return generateText(buildOutcomePrompt(context))
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test:run -- tests/lib/ai/outcomes.test.ts`
Expected: PASS.

- [ ] **Step 5: Thread the new params through the hook**

In `src/hooks/use-game-ai.ts`, extend `fetchOutcome` to accept an optional extras object and include it in the POST body:

```ts
const fetchOutcome = useCallback(async (
  storyContext: StoryContext,
  actionChosen: string,
  stat: Stat,
  outcome: OutcomeType,
  currentScene: string,
  extras?: { assistHelperName?: string; usedSignature?: boolean; signatureName?: string }
): Promise<string | null> => {
  setLoadingOutcome(true)
  setError(null)
  try {
    const response = await fetch('/api/ai/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyContext, actionChosen, stat, outcome, currentScene, ...extras }),
    })
    if (!response.ok) throw new Error('Failed to generate outcome')
    const data = await response.json()
    return data.narrative
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    setLoadingOutcome(false)
  }
}, [])
```

The route (`src/app/api/ai/outcome/route.ts`) already forwards the whole JSON body to `generateOutcome`, so no route change is needed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/outcomes.ts src/hooks/use-game-ai.ts tests/lib/ai/outcomes.test.ts
git commit -m "feat: weave assist and signature move into outcome narration"
```

---

## Task 7: Turn header — level badge + XP bar

**Files:**
- Modify: `src/components/game/player-turn.tsx`
- Modify: `src/app/play/page.tsx` (pass new props)
- Test: `tests/components/player-turn.test.tsx` (create)

- [ ] **Step 1: Write the failing render test**

Create `tests/components/player-turn.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerTurn } from '@/components/game/player-turn'

describe('PlayerTurn', () => {
  it('shows the hero level', () => {
    render(<PlayerTurn playerName="Lucas" characterName="Bjorn" characterClass="warrior" level={3} xp={2} xpToNext={15} />)
    expect(screen.getByText(/Lv\s*3/i)).toBeInTheDocument()
  })
})
```

**Required first (confirmed against the repo):** `vitest.config.ts` has `environment: 'jsdom'` and `globals: true` but **no `setupFiles`**, and there are no existing `.tsx`/render tests. This render test will fail with `toBeInTheDocument is not a function` until you:
1. Create `tests/setup.ts` containing `import '@testing-library/jest-dom'`.
2. Add `setupFiles: ['./tests/setup.ts']` to the `test` block in `vitest.config.ts`.

Both `@testing-library/react` and `@testing-library/jest-dom` are already in devDependencies — nothing to install. Do this before writing the test below.

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test:run -- tests/components/player-turn.test.tsx`
Expected: FAIL (props don't exist / level not rendered).

- [ ] **Step 3: Implement**

In `src/components/game/player-turn.tsx`, extend props and render a compact badge + thin XP bar (Danish not needed — it's a numeric badge):

```tsx
interface PlayerTurnProps {
  playerName: string
  characterName: string
  characterClass: CharacterClass
  level: number
  xp: number
  xpToNext: number
}

export function PlayerTurn({ characterName, characterClass, level, xp, xpToNext }: PlayerTurnProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]
  const pct = Math.min(100, Math.round((xp / xpToNext) * 100))
  return (
    <motion.div /* ...existing wrapper props... */ >
      <span className="text-2xl">{classDef.emoji}</span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-base font-serif font-medium text-primary">{characterName}</span>
        <span className="text-sm text-muted-foreground">{classDef.displayName}</span>
        <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="ml-auto self-start text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
        Lv {level}
      </span>
    </motion.div>
  )
}
```

(Keep the existing `motion.div` className; the pulsing dot can be removed or kept — removing it makes room for the badge.)

- [ ] **Step 4: Pass props from the play page**

In `src/app/play/page.tsx`, update the `<PlayerTurn .../>` usage:

```tsx
<PlayerTurn
  playerName={currentPlayer.name}
  characterName={currentCharacter.name}
  characterClass={currentCharacter.class}
  level={currentCharacter.level}
  xp={currentCharacter.xp}
  xpToNext={xpForNextLevel(currentCharacter.level)}
/>
```

Add `import { xpForNextLevel } from '@/lib/game/progression'`.

- [ ] **Step 5: Run test — verify it passes**

Run: `npm run test:run -- tests/components/player-turn.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/game/player-turn.tsx src/app/play/page.tsx tests/components/player-turn.test.tsx
git commit -m "feat: show level badge and XP bar in turn header"
```

---

## Task 8: Dice-phase controls — assist & signature buttons

**Files:**
- Create: `src/components/game/assist-button.tsx`
- Create: `src/components/game/signature-move-button.tsx`
- Modify: `src/components/game/outcome-display.tsx`
- Modify: `src/app/play/page.tsx`

- [ ] **Step 1: Create the AssistButton (presentational)**

`src/components/game/assist-button.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'

interface AssistButtonProps {
  helperName: string
  used: boolean
  onAssist: () => void
}

export function AssistButton({ helperName, used, onAssist }: AssistButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={used}
      onClick={onAssist}
    >
      {used ? `💪 ${helperName} hjalp til! (+2)` : `🤝 ${helperName}, hjælp til!`}
    </Button>
  )
}
```

- [ ] **Step 2: Create the SignatureMoveButton (presentational)**

`src/components/game/signature-move-button.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'
import type { SignatureMove } from '@/types/game'

interface SignatureMoveButtonProps {
  move: SignatureMove
  used: boolean
  onUse: () => void
}

export function SignatureMoveButton({ move, used, onUse }: SignatureMoveButtonProps) {
  return (
    <Button className="w-full" disabled={used} onClick={onUse}>
      {used ? `${move.emoji} ${move.name} brugt!` : `${move.emoji} Brug ${move.name}!`}
    </Button>
  )
}
```

- [ ] **Step 3: Add turn-scoped state to the play page**

In `src/app/play/page.tsx`, add state near the other `useState` calls:

```tsx
const [assistUsed, setAssistUsed] = useState(false)
const [usedSignature, setUsedSignature] = useState(false)
```

Reset both in `loadScene` (alongside the other per-turn resets):

```tsx
setAssistUsed(false)
setUsedSignature(false)
```

Compute the off-turn helper (the other selected hero):

```tsx
const helper = selectedPlayers.find(p => p.id !== currentPlayer?.id)
```

- [ ] **Step 4: Render the controls in the dice phase**

In the `gamePhase === 'dice'` block, above `<DiceRoller .../>`, add:

```tsx
{helper && (
  <div className="mb-2">
    <AssistButton
      helperName={helper.name}
      used={assistUsed}
      onAssist={() => setAssistUsed(true)}
    />
  </div>
)}
{currentCharacter.signatureReady && currentCharacter.level >= 2 && (
  <div className="mb-2">
    <SignatureMoveButton
      move={SIGNATURE_MOVES[currentCharacter.class]}
      onUse={handleUseSignature}
    />
  </div>
)}
```

Add imports: `AssistButton`, `SignatureMoveButton`, and `SIGNATURE_MOVES` from `@/lib/game/progression`.

- [ ] **Step 5: Implement `handleUseSignature` (guaranteed success, no roll)**

Add to the play page:

```tsx
const handleUseSignature = async () => {
  if (!selectedAction || !currentCharacter) return
  setUsedSignature(true)
  setDiceResult(null)          // no roll happened
  setOutcomeType('success')
  setGamePhase('outcome')

  const context = buildStoryContext()
  const narrative = await fetchOutcome(
    context, selectedAction.text, selectedAction.stat, 'success', currentSceneText,
    { usedSignature: true, signatureName: SIGNATURE_MOVES[currentCharacter.class].name,
      assistHelperName: assistUsed ? helper?.name : undefined },
  )
  setOutcomeNarrative(narrative ?? 'Historien fortsætter...')
}
```

- [ ] **Step 6: Fold assist into the normal roll path**

In `handleDiceRoll`, pass the assist bonus into `calculateOutcome` and the helper name into `fetchOutcome`:

```tsx
const calculated = calculateOutcome({
  sceneFit: selectedAction.sceneFit,
  statValue: stats[selectedAction.stat],
  diceRoll: result,
  difficulty,
  assistBonus: assistUsed ? ASSIST_BONUS : 0,
})
```

and

```tsx
const narrative = await fetchOutcome(
  context, selectedAction.text, selectedAction.stat, calculated.outcome, currentSceneText,
  { assistHelperName: assistUsed ? helper?.name : undefined },
)
```

Add `ASSIST_BONUS` to the progression import.

- [ ] **Step 7: Handle the no-roll display in OutcomeDisplay**

In `src/components/game/outcome-display.tsx`, make the roll line optional:

```tsx
interface OutcomeDisplayProps {
  outcome: OutcomeType
  diceRoll: number | null
  narrative: string
  isLoading: boolean
  onContinue: () => void
  signatureName?: string
}
```

Replace the roll paragraph with:

```tsx
{signatureName ? (
  <p className="text-muted-foreground">Du brugte <span className="font-bold text-foreground">{signatureName}</span>!</p>
) : diceRoll !== null ? (
  <p className="text-muted-foreground">Du slog en <span className="font-bold text-foreground">{diceRoll}</span></p>
) : null}
```

In the play page, update the render to pass `signatureName={usedSignature ? SIGNATURE_MOVES[currentCharacter.class].name : undefined}` and relax the render guard so the outcome shows when a signature was used (no `diceResult`):

```tsx
{gamePhase === 'outcome' && outcomeType && (
```

- [ ] **Step 8: Verify the suite still passes and commit**

Run: `npm run test:run`
Expected: all green.

```bash
git add src/components/game/assist-button.tsx src/components/game/signature-move-button.tsx src/components/game/outcome-display.tsx src/app/play/page.tsx
git commit -m "feat: add co-op assist and signature move controls to the dice phase"
```

---

## Task 9: XP grant + level-up celebration on Continue

**Files:**
- Create: `src/components/game/level-up-celebration.tsx`
- Modify: `src/app/play/page.tsx`

- [ ] **Step 1: Create the celebration overlay**

`src/components/game/level-up-celebration.tsx`:

```tsx
'use client'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface LevelUpCelebrationProps {
  characterName: string
  newLevel: number
  statLabel: string   // Danish stat name, e.g. "styrke"
  newStatValue: number
  onContinue: () => void
}

export function LevelUpCelebration({ characterName, newLevel, statLabel, newStatValue, onContinue }: LevelUpCelebrationProps) {
  return (
    <div className="fixed inset-0 bg-background/85 flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="bg-card border-2 border-primary rounded-2xl p-8 text-center space-y-4 max-w-xs w-full"
      >
        <span className="text-6xl block">⭐</span>
        <h2 className="text-2xl font-serif text-primary">Level {newLevel}!</h2>
        <p className="text-foreground">{characterName} blev stærkere!</p>
        <p className="text-muted-foreground">Din {statLabel} er nu <span className="font-bold text-foreground">{newStatValue}</span></p>
        <Button className="w-full" size="lg" onClick={onContinue}>Videre!</Button>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Add a Danish stat-label map to the play page**

```tsx
const STAT_LABEL_DA: Record<Stat, string> = {
  strength: 'styrke', magic: 'magi', agility: 'hurtighed', heart: 'hjerte',
}
```

Add `level-up` state:

```tsx
const [levelUp, setLevelUp] = useState<null | { characterName: string; newLevel: number; statLabel: string; newStatValue: number }>(null)
```

- [ ] **Step 3: Split `handleContinue` into apply + proceed**

Rename the current body to `proceedToNextTurn` (the rotation + `setTurnCounter` part), and make `handleContinue` first apply XP/level-up and either show the celebration or proceed:

```tsx
const proceedToNextTurn = () => {
  // ... existing turnSummary / newStoryHistory / newTurnHistory / nextPlayerIndex / updateAdventureState / setTurnCounter body ...
}

const handleContinue = () => {
  if (!currentCharacter || !currentPlayer) return
  if (turnResolvedRef.current) return   // guard against double-tap on Continue
  turnResolvedRef.current = true

  // Acting hero XP + level-up. Spend the signature FIRST (if used) by seeding
  // startingSignatureReady=false; a level-up inside applyXpAndLevelUp then re-grants it,
  // so "level-up recharges the move" wins over "spent" — the intended, generous behavior.
  const startingSignatureReady = usedSignature ? false : currentCharacter.signatureReady
  const gained = xpForOutcome(outcomeType ?? 'partial')
  const result = applyXpAndLevelUp(
    { level: currentCharacter.level, xp: currentCharacter.xp, signatureReady: startingSignatureReady },
    gained,
  )
  updateCharacter(currentPlayer.id, result.progression)

  // Helper earns a little XP too
  if (assistUsed && helper) {
    const helperChar = characters.find(c => c.playerId === helper.id)
    if (helperChar) {
      const hr = applyXpAndLevelUp(
        { level: helperChar.level, xp: helperChar.xp, signatureReady: helperChar.signatureReady }, 1)
      updateCharacter(helper.id, hr.progression)
    }
  }

  if (result.leveledUp) {
    const primary = PRIMARY_STAT[currentCharacter.class]
    setLevelUp({
      characterName: currentCharacter.name,
      newLevel: result.newLevel,
      statLabel: STAT_LABEL_DA[primary],
      newStatValue: getCharacterStats(currentCharacter.class, result.newLevel)[primary],
    })
    return // proceed happens when the overlay is dismissed
  }
  proceedToNextTurn()
}
```

Add imports: `xpForOutcome`, `applyXpAndLevelUp`, `PRIMARY_STAT` from `@/lib/game/progression`; `updateCharacter` from the store destructure; `Stat` type.

> **Note on signature spend:** only mark `signatureReady: false` when the move was used. The `applyXpAndLevelUp` result may itself set `signatureReady: true` (on level-up); applying `spentSignature` last means a hero who both used their move AND leveled up ends with a recharged move — which is correct and generous. This is intended.

- [ ] **Step 4: Render the overlay**

Near the pause overlay, add:

```tsx
{levelUp && (
  <LevelUpCelebration
    {...levelUp}
    onContinue={() => { setLevelUp(null); proceedToNextTurn() }}
  />
)}
```

Add the import for `LevelUpCelebration`.

- [ ] **Step 5: Verify + commit**

Run: `npm run test:run`
Expected: all green.

```bash
git add src/components/game/level-up-celebration.tsx src/app/play/page.tsx
git commit -m "feat: grant XP and celebrate level-ups on continue"
```

---

## Task 10: Full verification & smoke test

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + lint + full test suite**

Run: `npm run lint && npm run test:run`
Expected: no lint errors; all tests pass (existing 29 + new). Fix any TypeScript errors surfaced (especially around the `CharacterInput` type at the `characters/page.tsx` call site — it already passes exactly `{playerId, name, class, gender}`, so it should satisfy `CharacterInput` with no change; confirm).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds (this is what Vercel runs).

- [ ] **Step 3: Manual smoke test (dev server)**

Run `npm run dev`, then in the browser (use the **verify** skill / iPad-width viewport) walk one full loop:
1. Create two characters → confirm they start at Lv 1 with an empty XP bar.
2. Take several turns → XP bar fills; confirm a **level-up overlay** fires and the primary stat increments.
3. On a hero at Lv ≥ 2, confirm the **signature move** button appears, produces a guaranteed success with no dice, and disappears until the next level-up.
4. On the off-turn hero, tap **assist** → confirm +2 shows and the outcome narration mentions the helper.
5. Reload the page → confirm level/XP/inventory survive (localStorage + migration).
6. Save & quit, then resume → confirm progression rode along in the slot snapshot.

Confirm AI failures still fall back gracefully (kill wifi briefly during an outcome → "Historien fortsætter..." rather than a stuck screen).

- [ ] **Step 4: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found during Phase 1 smoke test"
```

- [ ] **Step 5: Deploy note**

Deployment is a manual step Steven owns (see `family-quest/DEPLOY.md`, CLI `vercel --prod`). No new env vars are introduced by Phase 1. Do **not** deploy without Steven's go-ahead.

---

## Notes for the implementer

- **Danish for kid-facing text; English for code and UI chrome.** Buttons the kids read (assist, signature, level-up) are Danish; the `Lv 3` badge is a universal abbreviation.
- **Never block the play loop on AI.** Every `fetchOutcome` already returns `null` on failure with a fallback string — preserve that.
- **Tuning knobs live in one place** (`progression.ts`: `XP_BY_OUTCOME`, `xpForNextLevel`, `ASSIST_BONUS`). After the first real family session, expect to retune these numbers — that's why they're isolated.
- **YAGNI:** `inventory` is declared and migrated but unused in Phase 1. Do not build loot UI or generation now — that's Phase 2.
