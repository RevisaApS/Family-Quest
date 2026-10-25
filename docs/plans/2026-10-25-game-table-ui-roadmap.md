# Game Table UI — Roadmap

Spec: `docs/specs/2026-10-25-game-table-ui-design.md`
Mockups: `docs/brainstorms/wireframes/2026-10-25-game-table-looks.html`

Six parts, one PR each, built in this order. Every part leaves the game fully playable.
Only Part 1 has a detailed task plan now. Part 3 restructures `src/app/play/page.tsx`, so
any line-level plan for Parts 3-6 written today would be stale before it is used. Each
later part gets its own detailed plan, written against `origin/main` right before it is
built.

| # | Part | Detailed plan | Depends on | Size |
|---|---|---|---|---|
| 1 | The next page is ready (prefetch) | `2026-10-25-part1-scene-prefetch.md` | nothing | M |
| 2 | Monsters keep their look | write before building | nothing | M |
| 3 | Game table on the play screen (+ split `play/page.tsx`) | write before building | 1 merged (both touch `loadScene`) | L |
| 4 | Battle view | write before building | 2 (monster portrait), 3 (components) | L |
| 5 | Rewards | write before building | 3, 4 (victory beat) | M |
| 6 | Heroes, setup, way home | write before building | 3 (tokens, primitives) | M |

## Rules for every part

- Start with `git fetch origin` and branch from `origin/main` (repo rule, `AGENTS.md`).
- Verify before merging:
  - `npx vitest run --exclude "tests/integration/**"`
  - `npx tsc --noEmit`
  - the `verify` skill on a prod build with stubbed AI. The dev server cannot be driven.
- Screenshots at 1180×820 and 820×1180 for any visual part.
- Ask Steven before any run that spends Gemini image credits (`LIVE_IMAGES=1`).
- `main` deploys straight to production. Merge only when the family is not playing.
- Kid-facing text goes through `t()` in Danish. No em dashes in UI copy.

## Notes for the later plans

- **Part 1 → Part 3:** Part 3 moves the prefetch effect and `loadScene` into
  `usePlayTurn`. Its "behaviour identical" check reruns Part 1's driven paths.
- **Part 2:**
  - `EncounterState` has no id today. Add `id` (created in `createEncounter`) together
    with `appearance`.
  - The persisted store is already at version 8. Bump it to 9, and migrate the saved
    adventures' snapshots too.
  - Bump `src/lib/idb.ts` `DB_VERSION` from 2 to 3 for the new `monsters` store.
  - Add a new monster portrait route; the hero recipe can't be reused.
  - Labelled image references change the `/api/ai/image` body and the hook's signature.
- **Part 5:** the reward chain has five `setTurnCounter` call sites. Centralise them in
  one "rewards done, next scene" function first.
- **Part 3:**
  - Do the split of `play/page.tsx` as its own first commit, with no visual change, and
    drive the app before restyling anything.
  - Replace the copied modal overlay string (6 files) with one `Overlay` component.
- **Part 4:** build on framer-motion (already installed, ^12.38). Keep every beat under
  900 ms, and wire `useReducedMotion()`.
- **Part 5:** the "rygsæk" slot changes game logic. Ask Steven first.
