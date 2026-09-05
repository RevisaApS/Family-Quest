---
name: engagement-loop
description: One autonomous improvement run for Family Quest's engagement. Reads the ledger and any new play notes, picks the single most kid-felt slice, builds it, verifies it in the driven app, ships it, and writes the ledger. Use when Steven says "run the engagement loop" or a routine fires with that instruction.
---

# Engagement loop

You are improving a game three people play together on one iPad: Far (Steven)
reads the Danish story aloud, and his twins Lucas and Mason (~8–10) tap their
actions and roll a physical d20. Everything you build is judged by one question:

> **Did the twins ask to play again?**

You cannot sit at the table, so you work from proxies (below) and from Steven's
play notes. When a play note and the backlog disagree, the play note wins.

Read `AGENTS.md` first. It is the law of the repo; this file only says how to
spend one run inside it.

## The goal, made concrete

A 30–45 minute session should have:

1. **No dead minute.** Every wait is short, or something is happening on screen
   while it lasts. Text is sized to be read aloud in one breath. Reward modals
   never stack.
2. **Stakes on every turn.** The d20 is drama: the target is visible before the
   roll, a 20 and a 1 feel different from a 14, and the outcome changes the
   world in a way the next scene remembers.
3. **Both twins in every turn.** The kid whose turn it isn't has a real thing to
   do or watch for, not just "wait".
4. **A world that remembers them.** Names they gave things, villains they beat,
   the wolf they spared, the pet they bought: these come back. The Hall of
   Heroes should feed new adventures, not only archive old ones.
5. **A reason to come back.** A session ends on a hook, and the next one opens
   with "sidst…". Unfinished business is a feature.
6. **Their voice.** "Min egen idé" is a first-class path, not a fallback. Choices
   fork the story visibly.
7. **Growth you can see.** Levels, gear in the portrait, awards: the hero on the
   screen looks like the hours they put in.

Prefer changes to **what the kids see and do each turn** over new systems. A
better wait screen beats a new inventory tab.

## Hard rails — never cross these

- **Danish, via i18n.** Kid-facing UI strings go through `t()` in
  `src/lib/i18n.ts`; story text is generated in Danish by the AI (never
  translated). UI chrome may stay English. Image prompts stay English.
- **Screen-light.** Nothing new that is always on screen. Far narrates; TTS
  stays off unless Steven asks. No autoplay audio.
- **AI never blocks the loop.** Every new AI call has a fallback that keeps the
  turn moving. No extra round-trip on the critical path scene → action → dice →
  outcome without measuring it.
- **The values layer stays invisible.** Never state a moral, never name a virtue
  in kid-visible text, never weaken the anti-preaching rules in
  `src/lib/ai/story.ts` / `actions.ts` / `epilogue.ts`. Read
  `docs/brainstorms/2026-07-24-values-layer-in-family-quest.md` before touching
  any prompt.
- **No credits burned.** Never call real image, portrait or scene-art generation
  from a run. Never add a per-turn image call. Live text-AI tests
  (`tests/integration`) run only if `GOOGLE_AI_API_KEY` is set in the
  environment *and* the change touched a prompt; scheduled runs normally have
  no key and verify with mocked AI.
- **localStorage is the store.** No Supabase, no sync, no accounts. A zustand
  persist `version` bump needs a migration that backfills **both** live state
  and every `savedAdventures[].snapshot`, plus a migration test.
- **`main` is production.** The kids may be playing on it right now. Anything
  half-finished stays on the branch.
- **Family-only.** No features for external users, no commercial track, no
  analytics that leave the device.

## One run

Do all of it. Do not ask questions mid-run; nobody is watching. Make the call
this file tells you to make and record open questions in the ledger.

**0. Sync.** `git fetch origin`. Branch from `origin/main` as
`loop/engagement-YYYY-MM-DD`. Confirm `npx vitest run --exclude "tests/integration/**"`
and `npx tsc --noEmit` are green before you change anything.

**1. Read.** In this order:
- `docs/loops/engagement/LEDGER.md` — top three entries. Do not redo what shipped;
  do pick up an explicit "next".
- `docs/playtests/*.md` newer than the last ledger entry. Anything under
  "Where they drifted" or "What they asked for" becomes the run's candidate
  before any backlog item.
- `docs/loops/engagement/BACKLOG.md` — the ranked hypotheses.
- Open PRs on the repo: if a previous run left one open, first decide whether to
  finish it (CI red, review comment) before starting new work.

**2. Look before you pick.** Spend real time in the app, not just the docs:
- Read the turn loop in `src/app/play/page.tsx` end to end once.
- Launch it (`GOOGLE_AI_API_KEY=dummy npm run dev`) and drive a few turns with
  the `verify` skill's mocked-AI recipe at iPad size (1024×768 landscape).
  Watch for the seven goals above failing in front of you.
- Confirm the backlog item you are about to pick is still true in the code.

**3. Pick one slice.** Exactly one. Rank by *kid-felt impact per line changed*.
It must be shippable in this run, verifiable with mocked AI, and not something
that needs Steven's taste to know it's good (a new visual identity, a new game
system, a tone change: those go on the backlog with a note, not into a run).
Write the hypothesis before writing code:

> If we ⟨change⟩, then during ⟨moment in the session⟩ the twins will ⟨behaviour⟩.

If you cannot fill in the third blank with something Steven could observe at the
table, pick something else.

**4. Build small.** Guideline: under ~300 changed lines, one PR. Deterministic
logic gets a vitest test. New kid-visible strings get `da` and `en` in
`STRINGS`. Prompt changes are in English and keep the existing rails intact. If
the right idea is bigger than one run, ship the first vertical slice the kids
can feel and put the rest on the backlog.

**5. Verify like a contributor, then like a kid.**
- `npx vitest run --exclude "tests/integration/**"`, `npx tsc --noEmit`, and
  `npx eslint` not worse than before.
- Drive the affected flow in the real app with mocked AI (the `verify` skill).
  Take screenshots at iPad size and attach them to the PR.
- Read the diff adversarially: what would make a 9-year-old confused, or make
  Far stumble reading it aloud? Is any new text Danish a Danish 8-year-old
  knows? Does anything now wait on the network that didn't before?

**6. Ship.** Commit with a message that says what the kids will notice. Push.
Open the PR with: the hypothesis, the kid's-eye change, screenshots, exactly
what was verified and what could not be, and one line **"Watch for at the
table"**. Then apply the merge bar below.

**7. Write the ledger.** Append the run to `LEDGER.md` using its template.
Re-rank `BACKLOG.md`: strike what shipped, add what you learned, move anything
a play note contradicted. If you need Steven to observe something specific next
session, add it as a question in the ledger entry — one line, not a survey.
Commit these with the same PR.

## Merge bar

Squash-merge the PR yourself when **all** of these hold:

- vitest and tsc green; eslint not worse.
- The affected flow was driven in the real app with mocked AI, screenshots in the PR.
- No persist `version` bump, no change to safety or anti-preaching prompt rails,
  no new call that costs credits, no new always-on UI.
- Every new kid-visible string went through `t()` and reads naturally in Danish.
- A plain `git revert` would cleanly undo it.

Otherwise leave the PR open, say in the PR and the ledger exactly which line
above failed, and stop. An open PR waiting for Steven is a fine outcome. A
merged surprise is not.

## Proxies you can measure without kids

When two slices look equally good, prefer the one that moves these:

- **Seconds of blank waiting per turn** in the driven app (scene, actions,
  outcome). Anything over ~3 s with nothing changing on screen is a defect.
- **Words read aloud per turn.** Scene + actions + outcome. Long is slow.
- **Taps per turn** for the acting kid, and **taps per turn for the other kid**
  (should not be zero).
- **Modals per turn.** More than one is a queue, not a celebration.
- **Callbacks per adventure**: how often a later scene references something the
  kids did or named earlier. The prompts already receive `storyHistory`; check
  whether they use it.

## What a run is not

- Not a refactor. Do not restructure `play/page.tsx` unless the slice needs it.
- Not a redesign. Visual identity is Steven's call; use the `frontend-design`
  skill only for components you are adding anyway.
- Not a re-litigation of old specs. `docs/specs` and `docs/plans` are history;
  the shipped game already has a quest arc, loot, shop, pets and custom actions
  that the 2026-07-03 spec listed as non-goals.
- Not a session with the kids. You never have that. Write the question down for
  Steven instead of guessing what they felt.

## Seeded map of the game (2026-09-05)

Orientation, not instruction. Confirm against the code before building; the
backlog carries the detail and the `file:line` references.

**One turn, as the table lives it.** `src/app/play/page.tsx` runs five phases:
`loading → scene → dice → outcome → rewards`. Per turn there are two hard AI
waits (scene, outcome), one soft wait (actions, with the scene still readable),
one background image, and two real decisions (pick 1 of 3, roll). Everything
else is Continue. Between turns the scene unmounts and a bouncing 🏰 is all that
is on screen. The Continue button after a roll does not exist until the outcome
prose arrives.

**The arc.** Three milestones, ~16–20 turns for two kids, tuned for ~45 minutes:
quest-giver opening → monster (turn 3) → monster (turn 7) → boss (turn 11, enrages
at half HP and reveals a weak stat, the one truly tactical beat) → victory overlay
→ AI epilogue with one award per kid → chronicle. No lose condition exists;
knocked-out heroes revive at half HP on their next turn.

**What is strong.** Targets shown before the roll, nat 20 / nat 1 as events,
shared team-takedowns of monsters, gear and pets visible in the AI art, the
invisible values layer (one stoic idea per adventure, villain as anti-virtue,
dilemmas to the room), the chronicle fed back into new openings ("the heroes
who crushed the Frost King"), "Min egen idé!" never rejecting a kid's plan, a
balance simulator that gates every constant.

**What is thin.** The off-turn twin has one optional +1 chip. Rotation is strict
round-robin; the scene's `suggestedNextPlayer` is discarded and
`src/lib/game/rotation.ts` is dead code. Everything a hero earned resets on
"Nyt eventyr" (by balance design), including the named pet. The Hall of Heroes
is text-only though portraits and item art sit in IndexedDB. The loot chest
never says whose it is. Custom ideas need typing on a shared iPad. There is no
recap on resume and no hook on quit.

**Where things live.** Game maths `src/lib/game/` (`rpg.ts` rewards and
encounters, `mechanics.ts` d20 and DCs, untouchable by the values layer);
prompts `src/lib/ai/` (`story.ts` scenes, `actions.ts` options and custom-idea
grading, `outcomes.ts`, `epilogue.ts`, `story-seed.ts` variety); the store and
its v7 migrations `src/stores/game-store.ts`; strings `src/lib/i18n.ts`;
the mocked-AI drive recipe in the `verify` skill. Kids' real-session feedback so
far lives in commit messages (`git log`, especially `36a4137`, `71ea4a1`,
`a32fe4b`), not in `docs/`.

**Docs that are history, not instruction.** The 2026-07-03 engagement spec's
Phase 3 shipped as "Min egen idé!"; its non-goals (quest arc, scene images) were
built anyway; its numbers were replaced by the d20 rework and the simulator.
`digest.md` was corrected on 2026-09-05.
