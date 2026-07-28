# Family Quest — Engagement Design

Date: 2026-07-03
Status: Approved (design), Phase 1 ready to plan
App: `family-quest/` (Next.js 16 + Gemini + zustand/localStorage)

## Problem

Family Quest works end-to-end but has never been played by the kids. The core loop
(scene → pick action → roll d6 → outcome → rotate) is engaging for one turn but does
not *accumulate*: a hero never grows, the off-turn kid only watches, and creativity is
limited to three preset actions. For 8–10-year-olds, those are the three most likely
points of disengagement.

## Players (ground truth)

Three players on one shared iPad: **Far (Steven)** narrates aloud in Danish; his twin
sons **Lucas** and **Mason** each read their own action options, tap a choice, and roll
a physical d6. There is no fourth player.

## Goals

Make the game more engaging along the three axes Steven prioritized:

1. **Growth / progress** — a hero visibly gets stronger over time (levels *and* loot).
2. **Off-turn engagement** — the kid who isn't acting has something meaningful to do.
3. **Self-expression** — kids can attempt their own ideas, not only preset actions.

## Non-goals (deliberate, do not build)

- **Quest-arc / ending mechanics.** Adventures stay endless; Far improvises conclusions.
  (Steven explicitly did not select "nothing to root for" as a gap.)
- **Supabase / cloud sync / backup tooling.** Single shared iPad → no sync need. Only
  benefit would be durability, addressed cheaply by PWA Add-to-Home-Screen. Revisit only
  if a real save-loss occurs or same-hero cross-device play is later wanted. Export/import
  backup was considered and declined — Phase 1 stays lean.
- **Scene images, TTS voice.** Screen-light philosophy holds; Far narrates.

## Guardrails (unchanged product decisions)

Danish kid-facing text (UI chrome may stay English) · you-narrate, kids tap + physical
d6 · screen-light (nothing new that is *always* on screen) · AI failure must never block
or stall the play loop · localStorage (zustand persist) is the real store.

## Approach: phased (Approach A)

Ship the highest-impact piece first, validate with real play, then layer.

- **Phase 1 (build now):** XP + levels + per-class signature move + co-op assist.
  Growth and teamwork ship together because they share the same turn moment (the roll)
  and reward each other (assisting earns the helper XP; level-ups are a shared moment).
- **Phase 2 (later, own mini-spec):** loot / inventory.
- **Phase 3 (later, own mini-spec):** "Noget andet…" custom action.

Each phase is independently testable and deployable.

## Foundation — data model & persistence

Three (Phase 1) + one (Phase 2 placeholder) fields on the existing `Character` type.
Because save slots already snapshot the full `characters` array, progression travels
with each adventure slot automatically — a hero can be level 5 in one saved story and
level 1 in another, with no new storage system.

```ts
interface Character {
  playerId; name; class; gender;   // existing
  level: number          // starts at 1
  xp: number             // starts at 0
  signatureReady: boolean // starts true — once-per-level special move is charged
  inventory: LootItem[]   // starts [] — declared now, filled in Phase 2
}
```

- `inventory` is declared in Phase 1 so storage is migrated **once**.
- **Persistence migration:** bump zustand persist `version` `1 → 2`. Backfill
  `level: 1, xp: 0, signatureReady: true, inventory: []` onto every character in BOTH the
  live `characters` array AND every `savedAdventures[].snapshot.characters`. Existing
  device and saved stories must upgrade without crashing on missing fields.
- **Stats are derived from class + level — no stored stat fields.** The four fields above
  are the entire migration surface. A hero's stats are computed, not stored: they equal the
  class base stats, with the **primary stat** raised by `(level − 1)` (i.e. +1 per level
  gained). `getClassStats(characterClass)` becomes `getCharacterStats(character)` (or
  `getClassStats(characterClass, level)`), taking level into account; the single call site
  at `play/page.tsx` must pass the character/level. `applyLevelUp` therefore stores **no
  stat** — it only increments `level` (and `xp`, `signatureReady`); the +1 emerges from the
  derived function. This is the source of truth; nothing double-counts.

- **Primary stat per class** (source of truth for the level-up bump and the celebration
  string; resolves the Ranger's stat tie explicitly):

  | Class | Primary stat |
  |-------|--------------|
  | Warrior | strength |
  | Wizard | magic |
  | Rogue | agility |
  | Ranger | heart |

## Phase 1 — mechanics

All deterministic; no network. Everything routes through the single existing formula in
`src/lib/game/mechanics.ts`.

### ① XP & levels

- XP per completed turn by outcome: **success 3 / partial 2 / failure 1**. Failing still
  earns XP (failure is a twist, not a punishment).
- XP required for next level: `xpForNextLevel(level) = level × 5` (fast early levels,
  gently slowing). `xp` tracks progress toward the **current** level's threshold: on
  level-up, subtract the threshold and carry the remainder (`xp -= level × 5; level++`).
  The level-up check loops so a large XP grant could cross multiple levels (can't happen
  early — max 3 XP/turn vs a 5 XP first threshold — but the loop keeps the function correct).
- **On level-up:** `+1` to the class's **primary stat** (auto — no pick prompt in
  Phase 1), `signatureReady` set true, and a brief celebratory Danish overlay
  ("⭐ Level 3! Din styrke er nu 6!") — tap to continue, then play resumes.

### ② Signature move (one per class)

- Unlocked at **level 2**, usable **once per level** (recharges on each level-up).
- Warrior *Skjoldstorm* ⚔️ · Wizard *Tryldeglimt* 🧙 · Rogue *Skyggespring* 🗡️ ·
  Ranger *Ørneblik* 🏹.
- When spent: the action is a **guaranteed success with no dice roll** — a rare cinematic
  "I unleash my power!" beat. Being once-per-level and roll-skipping makes it a resource
  kids save for a big moment. Sets `signatureReady = false` until the next level-up.

### ③ Co-op assist (off-turn kid)

- In the dice phase, before the roll, a non-acting selected player can tap
  **"Hjælp [navn]!"** → **+2** to the outcome score, **once per turn**. With the real
  roster (two twin heroes; Far narrates and is not a selected `Character`), the helper is
  simply the other twin — so the button targets the one non-acting hero unambiguously. The
  logic still generalizes to any non-acting selected player.
- The helper earns **+1 XP** (so helping levels them up too).
- The outcome narration is told an assist happened and by whom, and weaves in the
  teamwork.

### Formula change

Today: `score = sceneFitBonus + statValue + diceRoll` vs difficulty threshold.
Phase 1: `score = sceneFitBonus + statValue + diceRoll + assistBonus` (assistBonus ∈
{0, 2}); level stat bumps flow through `statValue`; a spent signature move short-circuits
`outcome = 'success'` without a roll.

### UI (screen-light)

- Turn header: compact `Lv3` badge + thin XP progress bar for the active hero.
- Dice phase: up to two contextual buttons that appear only when relevant —
  **Hjælp [sibling]** (off-turn kid) and the **signature move** button
  (when `signatureReady && level ≥ 2`).
- Level-up: one celebratory overlay, tap to dismiss. Nothing new is permanently on screen.
- All kid-facing strings in Danish.

### AI prompt changes

- **Outcome prompt** (`src/lib/ai/outcomes.ts`): pass whether an assist happened (and the
  helper's name) and whether the signature move was used, so the narrative reflects
  teamwork / heroics.
- Scene and action prompts: unchanged in Phase 1.

### Testing (TDD)

New pure functions are deterministic and testable alongside existing
`mechanics`/`classes`/`rotation` vitest suites:
- `xpForOutcome(outcome)` → 3 / 2 / 1
- `xpForNextLevel(level)` → `level × 5`
- `applyLevelUp` / XP grant → increments level, carries remainder XP, recharges signature
  (stores no stat); multi-level carry loop verified
- `getCharacterStats(character)` (derived) → primary stat = base + `(level − 1)`, others = base
- assist bonus applied in `calculateOutcome`
- signature move → guaranteed success path

### Error handling

Levels and assist are local/deterministic — no new network failure modes. The outcome AI
call keeps its existing fallback ("The story continues…"). The play loop is never blocked
by the new features.

## Phase 2 — loot / inventory (later, lighter detail)

- On a **success**, the outcome AI *may* award a story-fitting item; return type grows
  `{narrative}` → `{narrative, loot?: LootItem}`.
- `LootItem = { id, name (Danish), emoji, kind: 'trophy' | 'boon', bonus?: {stat, amount} }`.
  Trophies are keepsakes; boons give a small passive stat bump while held.
- Stored in `Character.inventory` (already declared → no second migration); travels with
  the adventure slot.
- UI: backpack icon with count badge → tap for the list; short toast on pickup. Never
  always-on-screen.
- Loot generation failing = no loot that turn; never blocks the loop.

## Phase 3 — "Noget andet…" custom action (later, lighter detail)

- A 4th button under the 3 generated actions. Tap → inline field where **Far** types the
  kid's spoken idea.
- A small new AI call adjudicates the free text against the scene → `{stat, sceneFit,
  sceneFitReason}`; the turn then continues normally into the dice phase.
- Guardrail: adjudicator keeps ideas grounded and age-appropriate; a wild idea returns
  `risky` (still playable).
- Fallback: if the call fails, Far picks the stat manually so a kid's idea never dies on a
  spinner.

## Risks & mitigations

- **Migration correctness** — the most fragile piece; a bad v1→v2 migration bricks
  existing saves. Covered by explicit backfill of both live state and every snapshot, plus
  a migration unit test.
- **Balance/tuning** — XP curve, assist size, level cadence are guesses until real play.
  Numbers are isolated in pure functions so they are trivial to retune after the first
  family session.
- **Signature move skipping the dice** removes the tactile ritual for that one action;
  accepted because it is rare (once/level) and intentionally special.

## Open items for playtest (not build blockers)

- Confirm the XP curve feels rewarding (target: a level-up within the first session).
- Watch whether auto stat-bump feels good or whether kids want to choose (easy future
  toggle).
- First real family session remains the highest-value validation.
