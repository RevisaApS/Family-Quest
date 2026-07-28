# Values Layer in Family Quest: Brainstorm / Discovery Notes
Date: 2026-07-24 · Goal: Design a layer of "good values" (Steven's example: stoicism) into the Family Quest game so Lucas & Mason absorb values through the story, without turning play into a lesson.

Context carried in (do not re-litigate, verify against code):
- Players: Steven ("Far") + twins Lucas & Mason (~8-10). Shared iPad, Far narrates in Danish, kids tap actions.
- Shipped product on `origin/main` is a full tactical kids' RPG: d20 quest arc, DCs, crits, boss phases, shop/gold/inventory, pets, teamwork/assist, custom "own ideas" actions, epilogues + Hall of Heroes, AI portraits + scene art, full i18n.
- Danish kid-readable story text is a hard guardrail. AI must never block the play loop.

## Summary / key decisions
(running synthesis — updated after every answer)

Decisions in order (details in the Q&A log; the consolidated brief is under **THE DESIGN** below):
D1 invisible/in-the-fabric mechanism · D2 all four dealbreakers are hard ACs · D3 stoicism as the spine · D4 one theme per adventure, villain = anti-virtue · D5 epilogue-award callback is the only landing signal · D6 cost = a forgone reward, never a harder roll · D7 acting kid taps, dilemma written to the room · D8 shortcut backfires immediately · D9 both branches complicate, so there's no pattern to crack · D10 deterministic theme rotation + a Far override · D11 four themes · D12 build it this session · D13 epilogue names the moment, never the lesson.

- **D1 — Mechanism: invisible, in the fabric.** No virtue meters, no named virtue UI, no "values system" the kids can see. The values live in the *content*: scenes plant genuine dilemmas, NPCs model the virtue, and outcomes make the lesson felt. Rejected: named/tracked virtues with rewards (virtue-as-currency risk), and the "cue card for Far" mechanism as the primary vehicle.

## Codebase ground truth (verified 2026-07-24, `origin/main` @ `59672bd`, local == remote, tree clean)
Where a fabric-level values layer would actually live:
- **Scene prompt**: `family-quest/src/lib/ai/story.ts:122-165` (`generateScene`). Tone from `STYLE_PROMPTS` (`:7-11`, 3 age tiers) + `MONSTER_TONE` (`:15-19`). Structure from `CHAPTER_BEATS` (`:37-41`) — a **fixed 3-act quest arc keyed off `milestonesDone`**, plus `questInstruction` (`:54-70`, invents quest/villain on scene 1) and `encounterInstruction` (`:72-94`). Returns JSON per `sceneSchema` (`:99-120`): `narration`, `imagePrompt`, `suggestedNextPlayer`, + first-scene `questTitle`/`questGoal`/`villainName`.
- **Action choices**: `src/lib/ai/actions.ts:45-87` — AI-generated, **exactly 3**, shape `{id, text, stat, sceneFit, sceneFitReason}` (`src/types/game.ts:28-34`). **In battle all 3 are forced to be attacks** (`actions.ts:62`) — a hard constraint on where dilemmas can appear. `classifyCustomAction` (`:92-134`) grades kids' free-text ideas, never rejects.
- **Outcome text**: `src/lib/ai/outcomes.ts:23-54`, plain text; `OUTCOME_INSTRUCTIONS` (`:17-21`) already frame failure as "a plot twist, not a punishment" — philosophically adjacent to stoicism already.
- **Turn loop**: all in `src/app/play/page.tsx` — `loadScene`(243) → `loadActions`(329) → `handleActionSelect`(470) → `handleDiceRoll`(619) → `resolveTurn`(484-617) [`calculateDC`/`resolveD20` in `src/lib/game/mechanics.ts:42-72`, pure math] → `fetchOutcome` → `handleContinue`(698) appends to `storyHistory`, rotates player round-robin (717).
- **Per-turn hook point**: `TurnRecord` (`src/types/game.ts:128-136`). Per-hero state: `HeroState` (`:74-93`) — already has a `comeback` (determination) field. Store: `src/stores/game-store.ts`, key `family-quest-storage`, **version 6**, cascading `if (version < N)` migrations at `:295-329`.
- **Existing reflective/meta beats** (candidate slots): Hall of Heroes `src/app/hall/page.tsx`; victory epilogue overlay `src/components/game/victory-overlay.tsx` (AI epilogue + one award per hero, `src/lib/ai/epilogue.ts:62-90`); level-up modal; monster-victory modal; loot-chest modal. No between-scene reflection screen exists.
- **i18n**: `src/lib/i18n.ts` `STRINGS {da,en}` + `t(key, language)`; story text is **generated directly in Danish** by the AI via `languageInstruction` (`src/lib/ai/language.ts:3-11`), not translated.
- **Tests**: pure unit tests in `tests/lib/**`; `tests/integration/live-ai.test.ts` is a live-Gemini shape smoke test. **No multi-turn game simulation harness exists.**
- Dead code worth knowing: `src/lib/game/rotation.ts` (fairness scheduler) and the scene's `suggestedNextPlayer` field are both unwired.

## Q&A log

### Q1: Mechanism — how visible should the values layer be?
- Asked: Should values be invisible in the storytelling, a named/tracked/rewarded system, a reflective cue you voice, or fabric + named virtues in phases?
- Captured: **Invisible in the fabric.** No new UI, no named virtue meters. Dilemmas planted in scenes, NPCs model the virtue, d20 outcomes make it felt. Kids never see a "values system".
- Implication accepted: cheapest build, no storage migration needed for the spine, zero virtue-as-currency risk — but carries the real risk that a lesson sails past two 9-year-olds unnoticed. That risk needs a mitigation later in this session.
- Flags: none

### Q2: Rejection criteria — what would make you rip it out?
- Asked: After one real session with the twins, what would make you send this back? (offered: preachy / slows the loop / nothing visibly lands / choices are fake)
- Captured: **All four are dealbreakers.** Steven selected every option. Treat these as hard acceptance criteria, not preferences:
  - **AC1 — Never preachy.** No narration that states the moral, no NPC wisdom speech, no virtue named in the text. Kids must never feel taught.
  - **AC2 — Zero drag on the loop.** Must fit inside the existing turn: hard word budget, no extra screens, no extra AI round-trips, no added waiting between rolls.
  - **AC3 — Something must visibly land.** Steven needs evidence it worked — a moment he can see. Fully invisible-to-everyone is a fail.
  - **AC4 — Real dilemmas only.** The virtuous option must genuinely cost something sometimes. No obvious right-button / wrong-button. Implies touching DCs/consequences (`mechanics.ts`), not just prompt text.
- **Core design tension (the actual problem to solve):** AC1+D1 (invisible, never explicit) pulls against AC3 (must visibly land); AC2 (no added time or length) pulls against AC4 (real trade-offs need setup and consequence). The design must resolve both, likely by making the *signal* Far-facing and the *cost* mechanical rather than narrated.
- Flags: none

### Q3: Value content — stoicism specifically, or "good values" generally?
- Asked: Is stoicism the actual content, or a stand-in? (offered: stoic spine / broad universal values / stoicism + family-named values / four classical virtues mapped to the four stats)
- Captured: **Stoicism as the spine.** A small, recurring, kid-sized vocabulary rather than a broad virtue list — chosen because it compounds (the twins meet the same few ideas repeatedly) and because Steven can reinforce it off-screen in real life, which is the actual transmission channel.
- Working set of stoic ideas to shape into kid form (to be refined): you control your choice, not the dice · the story you tell yourself about what happened · do the hard thing now · be the kind of hero who… · nothing is good or bad until you judge it.
- **Structural fit noted and accepted:** the d20 *is* the dichotomy of control — the kid owns the choice, never the roll. `OUTCOME_INSTRUCTIONS` (`src/lib/ai/outcomes.ts:17-21`) already frames failure as "a plot twist, not a punishment," i.e. the game is already quietly stoic. The layer extends an existing instinct rather than bolting on a new one.
- Rejected: broad universal-values list (no compounding, reads like a school poster); four classical virtues mapped to the four stats (tighter but drifts from what Steven actually cares about).
- Flags: kid-sized phrasing of each stoic idea, in Danish, not yet written → Steven + Claude, later in this session or at build time.

### Q4: Cadence — how often does a stoic beat appear?
- Asked: One theme per adventure / one dilemma per act / a loaded choice most scenes / AI's discretion? (Constraint surfaced: `actions.ts:62` forces all 3 actions to be attacks in battle, so dilemmas can only land in non-battle scenes.)
- Captured: **One stoic theme per adventure.** Chosen at quest-invention time (`story.ts:54-70`, where `questTitle`/`questGoal`/`villainName` are already generated). **The villain embodies the opposite of the theme** — e.g. theme "you control your choice, not the outcome" → a villain who makes villagers despair over what they can't change. Then 2–3 genuine dilemma beats across the arc.
- Why: the *quest itself* becomes the lesson, so it adds zero per-turn text (satisfies AC2), and it gives Steven exactly one idea per adventure to reinforce afterwards.
- Rejected: one dilemma per act (no compounding within a session, villain stays thematically neutral); loaded choice most scenes (highest preachy + pattern-spotting risk, breaks AC1); AI's discretion (may plant nothing all session, breaks AC3 with no diagnosability).
- Design consequence: a per-adventure `theme` needs to persist with quest state (`quest` in the store, `src/stores/game-store.ts`) so every subsequent scene prompt can reference it — this is the one piece of new persisted state the spine requires (store is at **version 6**; migrations at `:295-329`).
- Flags: none

### Q5: The landing signal — how does it show without the kids seeing a system?
- Asked: Epilogue callback / log it and surface in Hall of Heroes / a quiet cue Far can tap / nothing in-app, just a cheat sheet? (multi-select)
- Captured: **Epilogue callback only.** The existing per-hero award in the victory epilogue (`src/lib/ai/epilogue.ts:62-90`, shown via `src/components/game/victory-overlay.tsx`) gets extended to name the exact moment a kid made the hard choice, in story language — e.g. *"Lucas, der blev hos den sårede ulv, selv da porten lukkede."* Kids hear glory; Steven hears the value land; no moral is ever stated.
- Explicitly NOT doing: Hall of Heroes accumulation / per-choice logging (avoids a storage migration and long-horizon tracking), a tap-to-reveal Far cue (leaks on a shared iPad), and an out-of-app cheat sheet as the primary signal.
- Consequence — keeps the build lean: **no new per-turn persisted state**. VERIFIED: `EpilogueContext` (`src/lib/ai/epilogue.ts:12-28`) already receives `storyHistory`, `questTitle`, `questGoal`, `villain` and per-hero stats, and the prompt already feeds `storyHistory` to the model (`:72-73`) with award rules at `:84-87`. So AC3 is **a prompt edit plus passing the adventure's theme in** — no migration, no new UI.
- Flags: none

### Q6: The cost — what makes the right thing genuinely expensive? (AC4)
- Asked: costs a reward / harder roll (higher DC) / costs a resource (HP, gold, turn) / no mechanical cost, fiction only?
- Captured: **It costs a reward, not a roll.** The tempting option visibly offers something concrete — gold, loot, skipping a fight — and the hard right thing forgoes it. Legible to a 9-year-old without explanation. **Sometimes, unpredictably and never reliably, the forgone thing pays back later** (the wolf you saved returns) — that's "do the hard thing now" taught by plot rather than lecture.
- Explicitly rejected: **raising the DC for the virtuous choice** — it would make the dice punish virtue on average, teaching "being good makes you lose", and it contradicts the stoic premise that the roll is neutral and outside your control. Also rejected: resource cost (virtuous path becomes a tax the twins learn to dodge before a boss) and fiction-only cost (may not register as a cost at all to kids who track gold and HP).
- Design consequence: **`src/lib/game/mechanics.ts` is untouched** — no DC math changes. Cost is expressed in loot/gold/XP grants and in story consequence, i.e. in `applyTurnOutcome` territory (`src/lib/game/rpg.ts`) and prompt content.
- Flags: the "pays back later" callback needs a way for a later scene to know an earlier kindness happened — probably free via `storyHistory`, to confirm at design time.

### Q7: Whose dilemma is it, given strict round-robin turns?
- Asked: acting kid alone / both twins must agree / acting kid decides with twin advising / Far adjudicates?
- Captured: **Acting kid taps, but the dilemma is written as a question to the room.** Mechanically unchanged — the acting twin owns the choice, no change to the round-robin at `src/app/play/page.tsx:717`, no new interaction state. The dilemma text is phrased to the table (*"Hvad gør I?"*) so that when Steven reads it aloud, both twins naturally argue it out before the tap. The pedagogically valuable part — kids articulating reasons to each other — comes free.
- Rejected: mandatory twin agreement (strongest pedagogically and would fix off-turn boredom, but needs new loop state and slows turns → breaks AC2); twin-advises UI (most to build, invites override fights); Far adjudicating with no button (kills the felt ownership that makes it stick).
- Writing rule derived: **dilemma prompts must address the group, not the individual** — second-person plural in Danish.
- Flags: none

### Q8: What happens when they take the shortcut?
- Asked: works now/costs later / backfires immediately / costs later + chance to repair / nothing at all?
- Captured: **It backfires immediately.** Steven chose immediate, on-the-spot consequence over the delayed-cost option I recommended. His instinct: for kids this age the cause-and-effect has to be unmissable and attached to the choice, not surfacing two scenes later where it reads as unrelated.
- **Tension raised with Steven (unresolved at this point, see Q9):** reliable immediate backfire is the single fastest way to trip **AC4** — two bright 9-year-olds will learn "the tempting option is always a trap" and the dilemma collapses back into right-button/wrong-button. Resolution pursued in the next question rather than by overriding his choice.
- Flags: none

### Q9: How to keep immediate backfire from becoming a crackable pattern
- Asked: both paths complicate / backfire only sometimes / accept the pattern / backfire hits the world not their numbers?
- Captured: **Both paths complicate.** The shortcut's backfire is written as a *plot twist that makes things harder and more interesting*, not a penalty — the same instinct already encoded in `OUTCOME_INSTRUCTIONS` (`src/lib/ai/outcomes.ts:17-21`) for failed rolls. **And the virtuous path sometimes complicates too**: you stay to help the wounded wolf, the gate closes, now you find another way in.
- Why this resolves Q8's tension: neither option is ever safe, so there is no "tempting = trap" pattern to crack. The choice is about *what kind of trouble you chose* — which is the stoic point, and preserves AC4 while keeping Steven's immediate cause-and-effect.
- **Writing rule derived (central to the whole design): every dilemma branch leads somewhere interesting. Never a dead-end punishment, never a safe path. "Yes, and…" both ways.**
- Flags: none

### Q10: Who picks the adventure's stoic theme?
- Asked: rotation + Far override / rotation only / AI picks to fit the quest / Far picks in setup every time?
- Captured: **Deterministic rotation by default, plus a quiet override Steven can set before handing over the iPad.** Rotation guarantees every idea gets covered over weeks with no setup step and no visible values screen; the override exists for the weeks when the twins have been fighting about exactly one thing and Steven wants the adventure aimed at it. That targeting ability was judged the biggest teaching win available.
- Rejected: rotation with no override (can't aim it at real family life); AI free choice (best thematic coherence but coverage is luck — could hit the same idea five adventures running); Far picking in setup every time (a visible values screen on a shared iPad breaks the D1 invisibility, plus per-session friction).
- Design consequence: persisted state needed = the **current quest's theme** + a **rotation pointer / themes-used record** + an **override slot**. One store migration, **version 6 → 7** (`src/stores/game-store.ts:288`, migrate pattern at `:295-329`). Override must live somewhere off the play-setup flow so the twins don't meet it.
- Flags: exact placement of the override control (settings vs. hidden) → decide at design time.

### Q11: Which stoic ideas, and how many in the rotation?
- Asked: four (the tight core) / all six / three (the spine) / one idea all vacation?
- Captured: **Four ideas in the rotation.** Chosen for compounding — an idea returns roughly every fourth adventure, often enough to stick, varied enough not to loop.

**THE ROTATION (kid-Danish, as approved):**
1. **Terningen bestemmer ikke, hvem du er.** Du vælger, hvad du gør — terningen vælger kun, hvad der sker. *(dichotomy of control)*
2. **Det er ikke uheldet, der tæller.** Det er, hvad du gør bagefter. *(response over event)*
3. **Tag det svære først.** Så bliver resten lettere. *(do the hard thing now)*
4. **Andres vrede er deres.** Du behøver ikke tage den ind. *(not being ruled by others' provocation — earned its slot because it's what twins need daily)*

- Cut, as near-duplicates in kid terms: *"Hvem er du, når det er svært?"* (overlaps #1) and *"Du kan ikke vælge stormen, kun hvordan du sejler"* (overlaps #2). Keep them parked here as substitutes if one of the four underperforms in play.
- Rejected: all six (twins might never meet the same idea twice → loses the compounding that justified stoicism); three (drops the tempers one, their most frequent real problem); one idea all vacation (deepest but bets everything on one idea and risks repetition fatigue).
- Flags: none

### Q12: Deliverable from this session
- Asked: build it here / spec + plan only / thin slice with theme #1 / spec then hand to a claude.ai cloud session?
- Captured: **Build it in this session.** Claude writes the full spec as an implementation brief, dispatches a build agent, reviews the diff, runs the offline suite + live-AI preflight, and lands it on `main` (which auto-deploys to production). Rationale: scope fits one session and the twins can meet it at the next play.
- Verification path (from [[family-quest-verification-recipe]]): offline `npx vitest run` (expect ~108 pass / 5 skip); live preflight `set -a && . ./.env.local && set +a && npx vitest run tests/integration`. Browser-pane MCP **cannot** drive the play loop (visibilityState hidden → framer-motion stuck at opacity 0); use `playwright-core` + headless shell at `~/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell` if UI driving is needed.
- Rejected: spec-only (costs a second session); thin slice (content is the cheap part, saving is small); cloud-session handoff (loses this conversation's context beyond the doc).
- Flags: none

### Q13: How far does the epilogue award go in naming the idea?
- Asked: name the moment only / name the moment then the idea / name the idea as the hero's own thought / nothing in the award, put it in the story?
- Captured: **Name the moment only.** e.g. *"Lucas, der blev hos den sårede ulv, selv da porten lukkede."* The award describes what the kid did and stops. **The game never explains a lesson, anywhere, ever** — naming the idea is Steven's job at dinner, which is where he said the real transmission happens.
- Rejected: appending the kid-Danish phrasing (plants the language at the warmest moment, but it *is* the game stating the moral once per adventure → breaks AC1); the-hero's-own-thought framing (a tired 9-year-old won't hear the difference); nothing in the award (weakens Steven's signal → pushes against AC3).
- Flags: none

### Assumptions stated to Steven, not contradicted
1. Battle scenes carry the theme only through villain behaviour/dialogue — no dilemma choices there (`actions.ts:62` forces all 3 actions to be attacks in battle).
2. Dilemma beats are scheduled **deterministically, one per act**, riding the existing 3-act `CHAPTER_BEATS`/`milestonesDone` structure — reliable (AC3) and diagnosable.
3. The theme is never named abstractly in `questTitle`/`questGoal`/`villainName`. No "The Tale of Control".
4. Typed "own ideas" (`classifyCustomAction`) keep being graded exactly as today on `sceneFit`, never penalised for being the un-virtuous choice.
5. The settings surface holding Steven's override also shows the current adventure's theme, so he can check it before handing over the iPad.

---

## THE DESIGN (build brief)

**One-liner:** each adventure secretly carries one of four stoic ideas; the villain embodies its opposite; one dilemma per act offers a tempting reward against the harder right thing; both branches complicate; the epilogue award names the moment without ever naming the lesson.

**Hard acceptance criteria** (all four are dealbreakers, from Q2):
- **AC1** The game never states a moral. No virtue named in any kid-visible text, no NPC wisdom speech, no lesson language.
- **AC2** Zero drag on the loop: no new screens, no extra AI round-trips, no added waiting, hard word budget on scene text.
- **AC3** Something visibly lands for Steven each adventure — via the epilogue award naming a real moment.
- **AC4** Real dilemmas only: the right thing genuinely costs a reward, and no branch is ever safe.

**The four themes** — rotation, one per adventure (see Q11 for the Danish phrasings): control vs. dice · response over bad luck · hard thing first · others' anger is theirs.

**Mechanics of the layer:**
- Theme chosen at quest invention (`story.ts:54-70`); villain built as the anti-virtue; theme injected into every subsequent scene prompt.
- Dilemma = one of the 3 generated actions is the tempting shortcut (visible concrete reward: gold, loot, skipping a fight), one is the harder right thing that forgoes it, one is neutral. Phrased **to the room** in second-person plural (*"Hvad gør I?"*), acting twin taps.
- Shortcut **backfires immediately** — as a *plot twist that makes things harder and more interesting*, never a penalty. The virtuous path **also sometimes complicates**. Neither branch is safe; there is no pattern to crack.
- Forgone rewards **sometimes, unpredictably, pay back later** in the story.
- **`src/lib/game/mechanics.ts` is NOT touched.** No DC changes. Virtue never rolls harder.

**Code touch points:**
- `src/lib/ai/story.ts` — theme selection + injection; anti-virtue villain; per-act dilemma instruction.
- `src/lib/ai/actions.ts` — dilemma-shaped action generation for the scheduled beats (non-battle only).
- `src/lib/ai/outcomes.ts` — "both paths complicate" outcome rules.
- `src/lib/ai/epilogue.ts` — award rule: name the moment, never the lesson.
- `src/stores/game-store.ts` — migration **v6 → v7**: current quest theme, rotation pointer, Steven's override.
- `src/lib/i18n.ts` — any new UI strings (`STRINGS` da/en).

**Verification:** offline `npx vitest run` (~108 pass / 5 skip) + live preflight `set -a && . ./.env.local && set +a && npx vitest run tests/integration`. Browser-pane MCP cannot drive the play loop — use `playwright-core` + headless shell if UI driving is needed.

### Q14: Go-ahead and scope
- Asked: build on a branch then Steven pushes / build straight onto main (auto-deploys) / build but commit nothing / hold, something's missing?
- Captured: **Build on a branch.** Nothing reaches the production URL until Steven pushes. Claude dispatches the build agent from the brief, reviews the diff, runs the offline suite + live-AI preflight, and hands back a verified branch plus the exact merge command. No assumptions were contradicted and no missing branches were raised — alignment is complete.
- Branch: `values-layer-stoic-themes`, cut from `main` @ `59672bd`.
- Flags: none

## Build outcome (branch `values-layer-stoic-themes`, head `bd4b76e`)
5 commits, 14 files, 955 insertions, 51 new tests. `src/lib/game/mechanics.ts` untouched as specified.
- New `src/lib/game/values.ts`: the four themes (`da`/`en` + `antiVirtue` + `dilemmaGuidance` prompt fragments), `nextTheme`, `actIndex`, `phaseAllowsDilemma`, `shouldPlantDilemma`. Dependency-free and pure.
- `valuesInstruction` in `story.ts` carries the iron anti-preaching rules; `dilemmaInstruction` in `actions.ts` **explicitly forbids grading the harder option worse on `sceneFit`** — which is what actually enforces "virtue never rolls harder", since `sceneFit` feeds `calculateDC`.
- Store v6→v7; theme rides on `Quest`, so it survives reloads and save slots. In-flight v6 quests deliberately get NO theme (their villain was invented without one).
- Grown-up's control lives at the **unlinked route `/voksen`** — `/settings` turned out to be step 2 of the kids' onboarding flow, so a collapsed link there would have been the first thing a curious 9-year-old tapped.
- Verified: `npx vitest run` → **159 passed / 6 skipped / 0 failed** (baseline 108). `tsc --noEmit` clean. `next build` clean, `/voksen` prerenders. Lint unchanged at 18 pre-existing problems.
- Deviations accepted: opening scene never carries a dilemma (it's already inventing quest + villain); `'just-defeated'` counts as a legal dilemma scene (its actions aren't forced attacks, and excluding it would starve acts 2–3); the override is persistent rather than one-shot and doesn't consume a rotation step.

**Regression question — RESOLVED, measured.** The first branch preflight failed 1 of 6 (model returned a truncated `'p-'` for `suggestedNextPlayer`, a field required by the schema but read by no application code) and took 33.8s vs `main`'s 14.2s, raising an AC2 latency worry. A dedicated probe timed scene generation across all three configurations **in one run**, so model conditions were identical:

```
no theme      (pre-values baseline)  mean 2.29s   [2.63, 2.22, 2.03]   bad ids 0/3
theme only    (typical scene)        mean 2.11s   [2.05, 2.00, 2.30]   bad ids 0/3
theme+dilemma (once per act)         mean 2.23s   [2.23, 2.11, 2.34]   bad ids 0/3
```

**No measurable latency cost** — theme-only was actually the fastest of the three, which shows the spread is variance, not signal. **AC2 holds.** 0 malformed player ids in 9 sequential calls, and 0 hits on a crude Danish moral-language canary. The original failure came from the preflight firing 5 scene calls *in parallel*, which is not how the game generates; a clean re-run of the full preflight on the branch is **6/6 passing in 14.02s**, matching `main`'s 14.15s. Probe deleted; tree clean.

## Shipped 2026-07-27 — `origin/main` @ `9e28574`, live in production
Merging was not a fast-forward: four PRs (#10–#13) had landed on `origin/main` from cloud sessions while this was being built. The five values-layer commits were rebased onto them (one import conflict in `story.ts`), and `/voksen` returns HTTP 200 on production with the Danish strings present.

**The one substantive change the rebase forced.** PR #13 added `src/lib/ai/story-seed.ts`, which draws a random opening, stake and **villain archetype** per adventure to stop every quest opening the same way. On the opening scene that brief now lands in the same prompt as the values layer's `antiVirtue`, which also describes a villain — two competing villain briefs. Resolved by making the split explicit in `valuesInstruction`: **the seed owns the villain's shape, the theme owns their motive and habits**, and any example in the `antiVirtue` text is illustrative only, never to be copied over the villain the adventure already has.

Verified after the rebase: 195 tests pass (19 files — their PRs added tests too), `tsc --noEmit` clean. `next build` was **not** re-run post-rebase (the isolated worktree's symlinked `node_modules` breaks Turbopack); it passed pre-rebase on the same feature code, and `tsc` covers the type surface.

Live probe of the seed × values interaction, 4 opening scenes across 2 themes: four genuinely different settings, no idea-shaped quest title or villain name, 0 moral-language hits, and the anti-virtue surfacing as behaviour rather than doctrine — e.g. a wounded guard whispering *"Hun sagde, at det var vores skæbne at miste alt."* That is the fatalism villain shown, not explained, which is exactly AC1.

## Open flags (pending input)
- Substitute themes if one of the four underperforms in play: *"Hvem er du, når det er svært?"* and *"Du kan ikke vælge stormen, kun hvordan du sejler"* → Steven, after real sessions.
- Whether the "pays back later" callback needs any state beyond `storyHistory` → verify at build time.
