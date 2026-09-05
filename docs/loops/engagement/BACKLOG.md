# Engagement loop — backlog

Ranked hypotheses, top first. The loop re-ranks this every run: strike what
shipped (move it to the ledger), demote what a play note contradicted, promote
what a play note confirmed. Every item states the moment in the session it
fixes, the smallest slice that would let the twins feel it, and how to verify it
without kids or credits. `file:line` references were true on 2026-09-05; confirm
before building.

Ranking rule: **kid-felt impact per line changed.** A play note under "Where
they drifted" outranks everything here.

---

## Tier 1 — the turn itself (no dead air, stakes on every roll)

### ~~1. Keep the story on screen while the next scene loads~~ — shipped, run 1 (PR #19)

### 2. Never hold the table hostage to the outcome prose
- **Moment:** after every roll. Dice, chips and sound land instantly, but the
  Continue button does not exist until the outcome AI call returns
  (`src/components/game/outcome-display.tsx:135`). Second Chance / Rally trigger
  the same wait again.
- **Done in run 1:** (a) the failure fallback is now Danish via `t('storyContinues')`.
- **Hypothesis (remaining):** If Continue appears after a short grace period even
  when the prose is late, then a slow call never stalls the round.
- **Slice:** show Continue after ~6 s of loading with the Danish fallback, and let
  a late narrative still land in story memory.
- **Verify:** mocked route that never responds → Continue appears, text is Danish.
- **Merge bar:** yes if the late narrative is still recorded.

### 3. Give the waiting twin a bet on every roll
- **Moment:** half the session, the kid whose turn it isn't has one optional
  +1 chip (`Hvem hjælper til?`, `src/app/play/page.tsx:1259`) among four small
  buttons. +1 on a d20 is a 5 % swing; nothing invites them to look. The unused
  string `cheerHint` ("hepper!") in `src/lib/i18n.ts` shows this was meant to be
  more.
- **Hypothesis:** If the off-turn twin can predict the roll ("Over eller under
  12?") and win a coin for a right guess, then during their sibling's turn they
  will watch the d20 instead of drifting.
- **Slice:** a prediction chip in the dice phase for the non-acting hero, resolved
  from the raw d20 in `resolveTurn`, +1 gold to the guesser, a one-line toast. No
  AI. Pure function `resolvePrediction(guess, roll)` with tests.
- **Verify:** unit tests; drive a turn with the guess and assert the gold chip.
- **Economy note (run 1):** a coin per correct guess is ~0.5 gold per turn to
  the guesser, roughly +10 gold per kid per adventure against an economy the
  simulator tuned. Either make the reward non-monetary (the outcome prompt is
  told who guessed right and cheers; a streak shown on the party bar), or run
  `SIM=1 npx vitest run tests/sim` before and after and record the numbers.
- **Merge bar:** meets it if the reward is non-monetary (no store version bump
  needed if the guess lives in component state). With gold, PR only.

### 4. Say whose chest it is
- **Moment:** the loot chest opens after the turn pointer has moved on; the
  banner behind it shows the *next* kid and the modal never names the owner
  (`PendingChest.playerId` is captured, `src/app/play/page.tsx:68`, but not shown;
  `loot-chest-modal.tsx` has no name prop).
- **Hypothesis:** If the chest says "Lucas' kiste!", then the kid who earned it
  reaches for the iPad.
- **Slice:** pass the owner's character name into the modal, one Danish string.
- **Verify:** drive a ≥15 success, screenshot.
- **Merge bar:** meets it. Pair with #2a or #1 if the run has room.

### 5. Flatten the reward modal stack
- **Moment:** one good turn can chain MonsterVictory → LootChest → LevelUp ×N →
  castle, four full-screen takeovers with a Continue each
  (`src/app/play/page.tsx:1084-1136`).
- **Hypothesis:** If the chain reads as one celebration (tap-anywhere on the
  victory card, level-ups stacked into one screen), then a great roll feels like
  a moment rather than paperwork.
- **Slice:** auto-dismiss MonsterVictory on tap-anywhere with a 1.5 s minimum;
  queue level-ups into one card with a "næste" step. Leave the chest as is.
- **Verify:** drive a monster kill + crit; count taps to next scene before/after.
- **Merge bar:** meets it.

## Tier 2 — a world that remembers them, reasons to come back

### 6. "Sidst…" when a saved adventure is resumed
- **Moment:** session start. A resumed slot drops straight into a new scene; the
  story memory (`storyHistory`, up to 16 lines) is never shown to the family.
- **Hypothesis:** If resuming opens with three lines of "Sidst i eventyret…",
  then the twins are back in the story (and remember their pet's name) before
  the first roll.
- **Slice:** a card built locally from the last three `storyHistory` lines with
  the bracketed meta stripped; no AI call. Tap to start.
- **Verify:** seed a saved slot with history, resume, screenshot.
- **Merge bar:** meets it.

### 7. End on a hook
- **Moment:** "Gem og afslut". Today the slot card shows a name and a date.
- **Hypothesis:** If quitting produces one cliffhanger line ("Men oppe på
  klippen så noget jer gå…") shown on the slot card and read again at resume,
  then the next session gets asked for.
- **Slice:** one small AI call on quit with a local fallback line; store it on
  the `SavedAdventure` (no version bump if optional). Show on the home card.
- **Verify:** mocked call; fallback path; screenshot the card.
- **Merge bar:** meets it only if the field is optional and old slots render
  unchanged.

### 8. Let something they earned survive the adventure
- **Moment:** "Nyt eventyr" resets heroes to level 1 with 1 gold, no gear, no
  pet (`startNewAdventure`, `src/stores/game-store.ts:295`; `createHero`,
  `src/lib/game/rpg.ts:251`). This is a *balance decision* (the arc is tuned so
  level 5 lands at the boss; see `tests/sim/balance.sim.test.ts`), but it means
  the pet they named and saved 10 gold for is deleted, and the 20 boss gold is
  paid the moment the economy ends.
- **Hypothesis:** If the pet returns as a companion in the next adventure (name,
  look in the art, no stat bonus) and one trophy from the boss stays in the
  portrait, then they ask for "Bjørn" by name next week.
- **Slice:** carry `pet` (minus bonus) and one cosmetic `trophy` on the player,
  not the hero. Balance untouched.
- **Verify:** unit tests; drive a victory then a new adventure; check the image
  prompt body contains the pet.
- **Merge bar:** **does not meet it** (persist version bump). Open the PR, leave
  it for Steven.

### 9. Pictures in the Hall of Heroes
- **Moment:** between sessions. The Hall (`src/app/hall/page.tsx`) is text-only,
  though portraits and item pictures already live in IndexedDB. It is reachable
  only from the home screen.
- **Hypothesis:** If each kid's portrait heads their column and the victory
  overlay links to the Hall, then the Hall becomes the thing they show grandma.
- **Slice:** portrait per player from `src/lib/portraits.ts`; a "Heltehallen"
  button on the victory overlay.
- **Verify:** seed a chronicle + portrait, screenshot.
- **Merge bar:** meets it.

### 10. Make a returning enemy a rule, not a nudge
- **Moment:** the opening scene. The chronicle is already fed to the prompt as
  "THE FAMILY'S LEGEND" (`src/lib/ai/story.ts:52`) and the seed bans reused
  villain names, so callbacks are luck.
- **Hypothesis:** If every third adventure's villain is tied to a defeated one
  (a sibling, a lieutenant, a returned shadow), then "De husker os!" happens on
  purpose.
- **Slice:** a deterministic pick in `story-seed.ts` when the chronicle has ≥ 2
  entries; prompt fragment; unit tests on the builder. Values layer untouched
  (the seed owns shape, the theme owns motive — keep that split).
- **Verify:** unit tests on prompt output; no live call needed.
- **Merge bar:** meets it if the anti-preaching rails are unchanged.

## Tier 3 — their voice, and a change of rhythm

### 11. Speak the idea instead of typing it
- **Moment:** "✏️ Min egen idé!" is wired end to end
  (`src/components/game/action-picker.tsx:84`) but needs Far to type a
  9-year-old's sentence on a shared iPad, then a fourth AI wait.
- **Hypothesis:** If the kid can hold a button and say the idea (browser speech
  recognition, Danish), then own ideas get used several times a session.
- **Slice:** `webkitSpeechRecognition` with `lang: 'da-DK'` behind a mic button
  that only renders when the API exists; typing stays as fallback.
- **Verify:** cannot exercise recognition in headless Chromium; verify the
  fallback path and that the button hides when the API is absent. Note this
  honestly in the PR; Steven tests on the iPad.
- **Merge bar:** meets it (progressive enhancement, no new AI).

### 12. Let the story choose who acts, fairly
- **Moment:** every turn is strict round-robin (`src/app/play/page.tsx:792`).
  The AI is asked for `suggestedNextPlayer` on every scene and the answer is
  discarded; `src/lib/game/rotation.ts` (a fairness scheduler: nobody waits more
  than two turns) is dead code with tests.
- **Hypothesis:** If the villain can call Mason out by name and it becomes
  Mason's turn, then being addressed by the story is a thrill, and nobody is
  starved because the scheduler caps the wait.
- **Slice:** wire `rotation.ts` and the existing field; Far can see who's next.
- **Verify:** existing rotation tests + a drive where the mock suggests the same
  player twice.
- **Merge bar:** meets it, but watch fairness in the first play note.

### 13. One beat per act that is not a roll
- **Moment:** every turn has the same shape: read, pick 1 of 3, roll, read.
  Dilemma scenes are written to the room ("Hvad gør I?") but only one kid can
  answer.
- **Hypothesis:** If dilemma scenes need both twins to tap, and a disagreement
  becomes a line in the story, then the argument at the table becomes the game.
- **Slice:** a two-tap "group choice" mode on scenes flagged as dilemmas; the
  outcome prompt receives "the twins disagreed: X wanted…, Y wanted…".
- **Verify:** drive with a mocked dilemma scene.
- **Merge bar:** **design-sensitive** (changes the turn loop's contract). PR
  only; ask Steven in the ledger.

### 14. Show the "why" of the roll, once
- **Moment:** the AI grades every action good/okay/risky with a reason
  (`sceneFitReason`) that is never rendered.
- **Hypothesis:** If a 'risky' pick shows one short line after the roll ("Det var
  frækt: trolden så dig komme"), then the twins learn to read the scene.
- **Slice:** render the reason on the outcome card for `risky` only.
- **Merge bar:** meets it. Low priority: it is more text for Far to read.

## Tier 4 — small defects to fix when a run is nearby

- English fallback narrative, `src/app/play/page.tsx:691` (see #2a).
- `handleHeal` reads a stale store snapshot and may call `usePower` twice on the
  same hero (`src/app/play/page.tsx:737-747`). Verify, then fix.
- `luckyArmedFor` is not cleared by `loadScene`, so an armed Lucky Hand persists
  silently (`src/app/play/page.tsx:139, 641`).
- Default dice inventory has `d20: 0` (`src/stores/game-store.ts:140`), so the
  'physical' default rolls digitally until the family records their dice in
  settings. Check the settings step makes this obvious.
- "Spil videre" after the boss is a dead end: `milestonesDone` is maxed so no
  encounter can ever arrive again (`currentEncounterPhase`,
  `src/app/play/page.tsx:164`). Hide it, or make it one victory-lap scene then home.
- XP progress is visible only inside the inventory modal; the party bar shows
  level only (`src/components/game/party-bar.tsx`).
- Unused Danish strings that name planned affordances: `cheerHint`,
  `usePowerLabel`, `monsterAppears`, `bossAppears` (`src/lib/i18n.ts`).

## Not for the loop (Steven's calls, recorded so no run re-argues them)

- **TTS / voice narration.** Cut by Steven on 2026-07-03: Far narrates. The code
  in `src/lib/ai/tts.ts` is dead and calls a model that returns no audio. Only if
  Steven asks.
- **Telemetry** (a Supabase table of turns and waits) would give this loop eyes,
  but it is kids' data leaving the device. Steven decides; until then, play notes.
- **Content red-teaming** matters before anyone outside the family plays; it is
  not engagement work.
- **Balance constants** (`XP_PER_OUTCOME`, DCs, gold, HP). Only with
  `SIM=1 npx vitest run tests/sim` before and after, and a ledger note with the
  numbers.
- **Visual identity.** The candlelit storybook look was chosen on purpose
  (`5f41b3f`). Components added by a run follow it; no run redesigns it.
