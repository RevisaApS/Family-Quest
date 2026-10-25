# Part 2: Monsters Keep Their Look, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A monster looks the same in every scene of its fight. The story model fixes its
look once, the game paints one monster portrait, and every scene image of that fight gets
the portrait and the fixed look as references.

**Architecture:**
- The arrival scene returns `encounterAppearance` next to `encounterName`. The encounter
  stores it, with a new `id`.
- A new `/api/ai/monster-portrait` route paints one square portrait from name +
  appearance. The client downscales it and keeps it in IndexedDB (`monsters` store, keyed
  by encounter id).
- Scene images take **labelled** references (`{ label, dataUrl }`). One pure helper
  builds hero descriptions and hero references from the same list, so their order always
  matches, and adds the creature last.
- During the fight the story prompt carries the appearance, exempts the creature from
  "KEEP IT FRESH", and tells the model to name it in `imagePrompt` without redescribing it.

**Tech Stack:** Next.js 16 (App Router), React 19, zustand persist, IndexedDB, vitest.

Spec: `docs/specs/2026-10-25-game-table-ui-design.md`, Part 2.

---

## Background the engineer needs

- `EncounterState` (`src/types/game.ts`) has no id and no look. `createEncounter`
  (`src/lib/game/rpg.ts`) builds it; `loadScene` in `src/app/play/page.tsx` calls it when
  an arrival scene comes back.
- `sceneSchema` (`src/lib/ai/story.ts`) must declare every field the call wants. An
  undeclared field is silently dropped by the model.
- `heroImageDescriptions` and `getHeroPortraits` (`page.tsx`) filter players separately.
  A hero without a fresh portrait shifts every later portrait one place, so the model can
  put Lucas's face on Mason. The new helper replaces both.
- Part 1's prefetch builds the arrival scene before the encounter exists. Its image step
  sees the scene's `encounterAppearance` and paints the portrait first. The portrait
  promise is shared in memory (keyed by name + appearance), so `loadScene` adopting the
  prefetch never paints a second one.
- The prefetch key (`contextKey`) is the whole `StoryContext`. Adding `appearance` to
  `StoryContext.encounter` keeps that true: the field is set in a fixed position.
- `main` deploys to production. Image calls cost real Gemini credits: no live run without
  Steven's OK.

## File map

| File | Change |
|---|---|
| `src/types/game.ts` | `EncounterState` gains `id: string` and `appearance?: string` |
| `src/types/ai.ts` | `GeneratedScene.encounterAppearance?`, `StoryContext.encounter.appearance?` |
| `src/lib/game/rpg.ts` | `createEncounter(kind, name, milestones, partySize, appearance?)` sets `id` and `appearance` |
| `src/lib/ai/story.ts` | Schema field on arrival; appearance in the active-fight prompt; conditional KEEP IT FRESH; `imagePrompt` names the creature |
| `src/lib/ai/images.ts` | Labelled references, creature line, tone without generic monsters, `generateMonsterPortrait` |
| `src/app/api/ai/image/route.ts` | Body takes `references: { label, dataUrl }[]` and `creature` |
| Create `src/app/api/ai/monster-portrait/route.ts` | Paints one monster portrait |
| `src/hooks/use-game-ai.ts` | `fetchImage(request, opts)` with the new body; `fetchMonsterPortrait` |
| Create `src/lib/game/scene-cast.ts` | Pure: who is in the picture, in one ordered list |
| `src/lib/idb.ts` | `DB_VERSION` 3, `MONSTERS_STORE` |
| Create `src/lib/monster-portraits.ts` | Load and save a monster portrait by encounter id |
| `src/stores/game-store.ts` | Persist version 9; migration gives old encounters an id (live and saved slots) |
| `src/app/play/page.tsx` | One image-request builder; shared monster-portrait promise; arrival image waits for the portrait |
| Tests | `images.test.ts`, `story.test.ts`, new `scene-cast.test.ts`, `rpg.test.ts`, new `tests/stores/monster-encounter.test.ts`, `read-aloud.test.ts` version check |

---

### Task 1: Data shape

- [ ] Add `id` and `appearance?` to `EncounterState`; `encounterAppearance?` to
  `GeneratedScene`; `appearance?` to `StoryContext.encounter`.
- [ ] `createEncounter` takes an optional `appearance` and sets `id: crypto.randomUUID()`.
- [ ] Test: two encounters get different ids; the appearance is kept, trimmed; an empty
  appearance is stored as undefined.

### Task 2: The story model fixes the look

- [ ] `sceneSchema` declares `encounterAppearance` (required) on both arrival phases.
- [ ] The arrival instruction asks for it: one or two concrete English sentences with
  species, size, colours and one distinctive feature. The arrival `imagePrompt` shows the
  creature exactly that way.
- [ ] Active fight with an appearance: the prompt says how the creature looks, that the
  look never changes, and that `imagePrompt` names it without redescribing it.
- [ ] KEEP IT FRESH exempts the creature the heroes are fighting (active phase only).
- [ ] Tests: schema on arrival, appearance and name-only rule in the active prompt,
  freshness exemption only during a fight.

### Task 3: Labelled references and the creature line

- [ ] `buildImagePrompt(scene, style, heroDescriptions, opts)` with
  `opts = { heroReferences?: boolean, creature?: { name, appearance, hasReference } }`.
  - Heroes with references: "take each hero's face, hair, skin and body from the
    reference labelled with their name". The equipment rule is unchanged.
  - Creature: "The creature is {name}: {appearance}." plus "It must match the reference
    labelled {name}." when it has one.
  - The realistic tone drops "fierce monsters with glowing eyes" when a creature look
    is given.
- [ ] `referenceParts(refs)` interleaves `{ text: "Reference: {label}" }` before each image.
- [ ] `generateSceneImage(scene, style, heroDescriptions, references, creature?)`.
- [ ] `generateMonsterPortrait(name, appearance, style)`: one creature, full body,
  centred, simple background, no people, no text. 1:1.
- [ ] Route body: `{ sceneDescription, style, heroDescriptions, references, creature }`.
  New route `/api/ai/monster-portrait`.
- [ ] Tests: creature line with and without a reference, no generic monster tone with a
  look, labels interleaved before their image, monster portrait prompt.

### Task 4: One ordered cast

- [ ] `sceneCast(heroes, creature)` in `src/lib/game/scene-cast.ts`. Input: heroes in party
  order as `{ name, description, portrait | null }`, and the creature as
  `{ name, appearance, portrait | null } | null`. Output: `heroDescriptions`,
  `references` (heroes with a portrait, then the creature), `creature` for the prompt.
- [ ] Tests: a hero with no portrait does not shift the others; labels match names; the
  creature comes last; no creature means no creature fields.

### Task 5: Store and IndexedDB

- [ ] `DB_VERSION` 3 with `MONSTERS_STORE = 'monsters'` in `onupgradeneeded`.
- [ ] `loadMonsterPortrait(id)` and `saveMonsterPortrait(id, dataUrl)`.
- [ ] Persist version 9. Migration: the live encounter and every
  `savedAdventures[].snapshot.encounter` get an id when missing. No appearance, so no
  portrait: old fights look as they did.
- [ ] `loadAdventure`'s pre-v4 boss fallback gets an id too.
- [ ] Tests: v8 state with a live encounter and a saved slot migrates; version is 9.

### Task 6: The play page

- [ ] `buildStoryContext` passes `appearance`.
- [ ] Replace `heroImageDescriptions` + `getHeroPortraits` with:
  - `heroPortraitMap()` (cached `Map<playerId, dataUrl>`);
  - `monsterPortrait({ id?, name, appearance })`: one shared promise per name +
    appearance. Tries IndexedDB by id, else paints, downscales and returns. A failed paint
    is forgotten so a later scene can try again.
  - `paintScene(scene, heroes, creature, opts)`: awaits portraits, builds the cast,
    calls `fetchImage`.
- [ ] `sceneCreature(phase, scene, encounter)`: on arrival, the scene's name (with the same
  fallback names `loadScene` uses) and `encounterAppearance`; during an active fight, the
  stored encounter when it has an appearance; otherwise none.
- [ ] `loadScene`: create the encounter with the appearance; start its portrait and save
  it under the new id; the arrival image waits for the portrait (via `paintScene`).
- [ ] The prefetch image step uses the same `paintScene` with the projected phase.

### Task 7: Verify

- [ ] `npx vitest run --exclude "tests/integration/**"`, `npx tsc --noEmit`, eslint on
  touched files (5 known `usePower` errors in `page.tsx`).
- [ ] Prod build with stubbed AI. Drive: first scene, turns until a monster arrives, two
  fight scenes. Check the request bodies: one monster-portrait call, the arrival image
  sent after it with the creature reference, the next fight image with the same
  reference and label. Reload mid-fight: no second portrait call.
- [ ] Ask Steven before the live image check (`LIVE_IMAGES=1`, about 50 øre): the same
  troll across two scenes.
- [ ] Merge only when the family is not playing.
