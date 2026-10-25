# Family Quest — Game Table UI Design

Date: 2026-10-25
Status: Approved by Steven (direction A, HP option 1, landscape first, six parts in this order)
Mockups: `docs/brainstorms/wireframes/2026-10-25-game-table-looks.html`
(published copy: https://claude.ai/code/artifact/40230af2-3e2e-4905-b355-67ee821f3f00)

## Why

Steven, Lucas and Mason want the game to look and feel better before the next rounds.
Steven's asks on 2026-10-25:

1. A nicer UI overall.
2. Hit points that still read well as heroes level up.
3. The next scene and picture made in the background after the roll, so "Videre" is instant.
4. A general UX pass.
5. A cooler battle view with animation.
6. Monsters that keep their look between scenes.

What the code shows today (2026-10-25, `main` at 858ad7e):

- The look is a dark walnut/ember storybook (IM Fell English + Alegreya). It is pleasant
  but flat: mostly forms and buttons.
- Default buttons are 40 px high (`components/ui/button.tsx`). The 2026 design brief
  (`docs/discovery/10-design-brief-stitch.md`) asked for 60 px+. Party-bar labels are 10 px.
- No `prefers-reduced-motion` handling anywhere.
- `src/app/play/page.tsx` is 1675 lines and owns the whole turn loop, so every UI change
  touches it.
- Styling is repeated by hand: the modal overlay class string is copied across 6 files,
  and raw `oklch(...)` values sit in encounter-banner, dice-roller and scene-display.
- A fight is the normal turn loop plus a small encounter banner. There is no battle view.

## Decisions

| Topic | Decision |
|---|---|
| Visual direction | **A, "Spillebordet"** (game table). The other two (storybook, campfire) are rejected. |
| Palette | Teal felt table, walnut frame, ivory cards, brass accent. Single dark world; the unused light palette goes. |
| Type | Display: Lilita One (headings, names, numbers). Body: **Andika**, a typeface built for children learning to read. Both via `next/font/google`. Minimum text 14 px; scene text about 20-22 px on iPad. |
| Hero identity | Each hero gets one colour and one initial, used everywhere (token, card, seal, reward header). Colour comes from party slot (4 fixed hues). Colour is never the only cue: the initial and name always appear too. |
| Hit points | **Number + segmented bar**: `♥ 7/10`, one segment per HP. Segments merge into a smooth bar when max HP is above 20. Same component for heroes and monsters. |
| Orientation | **Landscape first** (iPad lying on the table between three players). Portrait gets its own stacked layout with the primary action pinned to a bottom bar. |
| Touch targets | Minimum 60 pt for anything a child taps. |
| Motion | Short and purposeful, under 900 ms per beat. `prefers-reduced-motion` turns off shake, slash and flying effects and keeps the numbers. Nothing flashes more than 3 times a second. |
| Kid-facing text | Danish via `t()`, as today. |

## The six parts

Each part is one PR that leaves the game fully playable. Build them in this order.

### Part 1. The next page is ready (prefetch)

Facts (turn-loop audit, 2026-10-25):

- One turn is two AI calls after the roll: `/api/ai/outcome` (story writer, about 5 s),
  then `/api/ai/scene` (about 5 s) once "Videre" is tapped, then `/api/ai/actions` and
  the scene image.
- The next scene needs the outcome text (it enters `storyHistory` in `handleContinue`,
  `page.tsx:961-964`), not the tap itself.
- Things that can change the scene's inputs after the outcome is shown: reroll and Rally
  (new outcome), Shield (HP), monster victory (milestones, level-ups), loot equip (gear),
  level-up skill pick (skills).
- The next hero's auto-revive happens inside `loadScene` (`page.tsx:366-371`).
- No fetch has an AbortController. A late image `.then` can paint onto a newer scene
  (`page.tsx:433`).

Design:

- A pure module `src/lib/game/prefetch.ts` projects the state after "Videre" and keys a
  `StoryContext`. **The key is the whole context.** Gear, powers and pet are woven into
  the scene prose (`story.ts:29-41`), and new gear must show in the picture, so any
  change at all means a new page.
- When the outcome text is committed to state, an effect builds the context as it will
  be after "Videre":
  - append the pending story line;
  - add one to the turn count (this flips `arriving-monster` and `arriving-boss`);
  - advance the player index;
  - apply the next hero's auto-revive;
  - compute the dilemma flag as a pure value.
  It then starts the scene request with no loading or error state. When the scene
  returns, it starts the image (painting the next hero standing) and the actions in
  parallel.
- The prefetch only **requests**. It never sets `dilemmaRef`, never calls
  `markDilemmaPlanted`, and never touches quest, encounter or enrage state. `loadScene`
  does all of that when it adopts a scene, exactly as today.
- `loadScene` is the single adoption point, because all five `setTurnCounter` sites
  lead there. It builds the real context and compares keys:
  - Equal: use the prefetched scene, actions and image. The image shows when it
    arrives, as today.
  - Different: abort and fetch fresh, exactly as today.
- The key compare is the single source of truth. Rerolls, Rally, Shield, Heal, potions,
  shop buys, loot equips and skill picks all change the key. Re-running the prefetch
  when heroes or the outcome change is only an optimisation.
- No prefetch while a monster or boss victory is pending: the payday changes milestones
  and levels.
- An id guard absorbs StrictMode's double effects, so dev never pays twice.
- The projection applies the next hero's auto-revive (pure `reviveHero`) exactly as
  `loadScene` will, so the prefetch and the real context agree. The revive itself stays
  in `loadScene`.
- Add an optional AbortSignal and a `silent` mode to the scene, actions and image
  fetches in `src/hooks/use-game-ai.ts`. A per-scene sequence number in `loadScene`
  drops a late image or actions result that belongs to an older scene.
- Narration (TTS) is **not** prefetched: Google caps it near 100 requests a day.
- Cost: aborting stops the browser waiting, but the server may finish its Gemini call.
  A thrown-away prefetch can cost one image. That is rare and cheap. The common
  discards are rerolls and chests with gear, and a gear chest comes about once in
  eight turns.

Done when:

- Unit tests cover the projection and the key.
- In the driven prod build with stubbed AI (scene 4 s, image 6 s), the next scene text
  appears under 300 ms after "Videre" when nothing changed.
- A reroll before "Videre" produces a fresh scene that matches the new outcome.
- A spawn turn adopts the prefetch, and the encounter appears exactly once.

### Part 2. Monsters keep their look

Facts (image audit, 2026-10-25): `EncounterState` (`src/types/game.ts:99-110`) has a name
and HP but no appearance. The story model re-describes the creature in every scene's
`imagePrompt` at temperature 1.2. Its "KEEP IT FRESH" rule (`src/lib/ai/story.ts:228`)
pushes it to vary creatures. The encounter name never reaches the image route. Only hero
portraits go in as references, unlabelled, and the order of portraits and descriptions
can differ (`heroImageDescriptions` at `page.tsx:264-288` and `getHeroPortraits` at
`page.tsx:294-300` filter separately).

Design:

- **Data.**
  - When the story model opens an encounter, it also returns `encounterAppearance`: one
    or two concrete English sentences covering species, size, colours and one
    distinctive feature.
  - Declare the field in `sceneSchema` (`story.ts`, around 172-195), or the model drops
    it. Add it to `GeneratedScene` and `StoryContext.encounter` too.
  - `EncounterState` gains `id` (made in `createEncounter`) and `appearance`.
  - The persisted store is already at version 8 (`game-store.ts:339`). Bump it to 9.
    The migration covers the live encounter and `savedAdventures[].snapshot.encounter`.
    Old encounters keep no appearance and no portrait.
- **Portrait.**
  - At encounter start the game paints **one monster portrait** from name + appearance.
  - It needs a new `generateMonsterPortrait` and route: the hero portrait recipe is
    hardcoded as a smiling, empty-handed hero (`images.ts:151-158`).
  - Downscale the portrait like hero portraits. Store it in IndexedDB in a new
    `monsters` store, keyed by encounter id. That bumps `DB_VERSION` from 2 to 3 in
    `src/lib/idb.ts`, with the new store added to `onupgradeneeded`.
  - The portrait is shown on the battle card (Part 4).
- **The arrival scene.** The encounter only exists once the arrival scene returns, so
  that scene's image waits for the portrait and then uses it as a reference. This also
  holds when the arrival scene was prefetched (Part 1): the prefetch's image step
  checks the scene for `encounterAppearance` and paints the portrait first.
- Each scene image during the encounter:
  - gets the monster portrait as a reference, labelled with the monster's name;
  - gets the line "The creature is {name}: {appearance}. It must match the reference
    labelled {name}.";
  - labels hero portraits by name too. Descriptions and portraits are built from one
    list, so their order always matches.
  - Labels need new plumbing. `/api/ai/image` and `generateSceneImage` take only an
    unlabelled `heroPortraits: string[]` (`image/route.ts:6-24`, `images.ts:101-104`).
    Send `{ label, dataUrl }` pairs instead, and interleave a text part ("Reference:
    Lyn") before each image part.
- During an encounter the story prompt receives the appearance. The "KEEP IT FRESH" line
  (`story.ts:228`) becomes conditional and exempts the active creature. The model is told
  to name the creature in `imagePrompt` without redescribing it, so its own words don't
  fight the fixed appearance line.
- The realistic tone's generic "fierce monsters with glowing eyes" is skipped when an
  appearance exists.
- Cost: one extra image per encounter (3 per adventure).

Done when:

- Unit tests cover the prompt builders (appearance line, labelled references, matching
  order).
- Steven has approved one live image check (`LIVE_IMAGES=1`, about 50 øre) showing the
  same troll across two scenes.

### Part 3. The game table on the play screen

- **Tokens and primitives.**
  - Replace the walnut/ember theme in `src/app/globals.css` with table tokens: felt,
    walnut, card, card ink, brass, hero 1-4, danger, success.
  - Set a type scale and the 60 pt touch minimum. Remove the inline `oklch(...)` values
    and the copied overlay string, using one `Overlay` component instead.
  - Swap the fonts in `src/app/layout.tsx`.
- **Components** (new, in `src/components/table/`): `TableFrame`, `HeroToken`, `HpMeter`,
  `SceneCard`, `ActionCard`, `DieButton`, `TurnSplash`.
- **Split `play/page.tsx`.** Move each phase into its own component (`ScenePhase`,
  `DicePhase`, `OutcomePhase`) and the turn logic into a `usePlayTurn` hook. Keep the
  behaviour identical, so later parts edit small files.
- **Layout (landscape).** Hero tokens across the top, then the scene card and text, then
  the hand of action cards with the d20. Everything for the current step is visible
  without scrolling at 1180×820 and 1024×768.
- **Layout (portrait).** A compact scene strip, then the cards, with the primary button
  pinned to a bottom bar.
- **UX fixes in this part** (from the 2026-10-25 UX review):
  - The chosen card stays visible above the die, with a "Skift" button until the die is
    thrown.
  - "Nu er det Lucas' tur" splash with the hero token between turns. It doubles as the
    loading cover on the turns where the prefetch was discarded.
  - The die stays on screen about 1.5 s showing "14 ≥ 12 ✓", with the XP, damage and
    gold chips. "Videre" still waits for the outcome text, because the story line and
    the Part 1 prefetch are built from it. While it waits, it shows "skriver…" in place
    of hiding.
  - Powers on the outcome screen (Reroll, Rally, Shield) get a one-line effect ("Slå igen").
  - "Min egen idé" opens as a bottom sheet pinned above the keyboard. The sheet has a
    🎤 dictation hint and three starter chips ("Jeg bruger…"). The typed idea and its stat
    show on the chosen card.
  - The read-aloud toggle gets words ("Læs op"), not only 📖/🗣️.
  - Errors show as an icon plus "Prøv igen" in the slot where the missing thing belongs.
    No flavour text.
  - Long narration splits into 2-3 short chunks with a "Mere ▶" tap.

Done when:

- tsc and vitest are green.
- The driven prod build plays three full turns with stubbed AI.
- Screenshots at landscape and portrait sizes show no scrolling for the current step.
- Reduced motion is honoured.

### Part 4. The battle view

- While an encounter is alive, the middle of the table becomes an **arena**:
  - the party column with `HeroToken` + `HpMeter`;
  - a "VS" mark;
  - the **foe card** with the monster portrait (Part 2), its name, a MONSTER/BOSS tag
    and `HpMeter`.
  - The hand of cards and the d20 stay at the bottom.
- Five animated beats (framer-motion):
  1. **Start.** The foe card slides in with its name. Roar sound.
  2. **Hit.** A slash crosses the card, the card shakes, "−2" floats up, and segments
     drop one at a time.
  3. **Counter.** The hurt hero's token shakes red and its segments drop.
  4. **Enrage** (boss, half HP). The card glows red and a sign shows the weak spot ("Snilde +1").
  5. **Victory.** The card flips to "Besejret", coins fly to the purse, and rewards
     appear on the same screen (Part 5).
- **Knockout beat.** A full-width "Aldor er faldet! Lucas kan hjælpe", a 💤 on the token,
  and its own sound. The revive banner says plainly that nobody helped.
- **Off-turn players.** Their high/low bets show as their tokens beside the die, and the
  result gets a short cheer. This applies in and out of battle.

Done when:

- The driven build walks start → hit → counter → enrage → victory and a knockout.
- Reduced motion shows the numbers without shake or slash.

### Part 5. Rewards

- One **"Sejr!" screen** merges monster victory and the loot chest, cutting 4-6 taps to
  about 2.
- Every reward screen has an owner header with the hero token ("Lucas' skat", "Mason
  vælger en kraft").
- Chest and shop show **new vs. current item side by side** with ⬆/⬇ stat changes, and
  the game asks once before a downgrade.
- A greyed-out price says what is missing ("mangler 12 🪙").
- Level-up, shop, inventory and epilogue get the table style.

Open question for this part: a one-slot "rygsæk" so a skipped item is not lost changes
game logic. Ask Steven before building it.

### Part 6. Heroes, setup and the way home

- Home, players, settings, characters and the Hall of Heroes get the table style.
- "Samme hold, spil igen" starts a new adventure with the same heroes and settings.
- Settings start from good defaults, with one "Ændr" link instead of a five-section form.
- Pause gets a "Hjem" button and the line "Alt er gemt ✓". The save name becomes
  optional and auto-generated.
- Deleting a saved adventure needs a long press, not a tap next to "Fortsæt".

## How each part is verified

- `npx vitest run --exclude "tests/integration/**"` and `npx tsc --noEmit`.
- The `verify` skill drives a prod build (`next build && next start`) with stubbed AI. The
  dev server cannot be driven (see the verification recipe in project memory).
- Screenshots at 1180×820 (landscape) and 820×1180 (portrait).
- No run that spends Gemini image credits without Steven's OK.
- `main` deploys straight to production. Merge only when the family is not playing.

## Out of scope

- The reading mode (separate principles session, `.claude/handoffs/2026-10-13-reading-mode-principles.md`).
- Balance constants (HP, damage, XP, prices).
- The text model, prompts beyond the monster appearance, and TTS.
- Supabase.

## Open questions

- Hero colour by party slot (default) or picked by each kid at character creation. Slot
  colours ship first; picking can come later.
- The "rygsæk" slot (Part 5).
