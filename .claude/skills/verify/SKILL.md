# Verify Family Quest

How to drive this app end-to-end without a Google AI key.

## Build & launch

```bash
npm install
GOOGLE_AI_API_KEY=dummy npm run dev   # port 3000; AI routes are mocked in the browser
```

## Drive (Playwright, no key needed)

Install `playwright-core` in a scratch dir (browsers are pre-installed at
`/opt/pw-browsers/chromium` in Claude Code web sessions; locally use your own
Chromium). Then:

1. **Mock the AI at the network layer** with `page.route('**/api/ai/...')`:
   - `scene` → `{ narration, imagePrompt, suggestedNextPlayer, bossName }`
   - `image` → `{ imageUrl: <1px data URL> }` (assert the request body's
     `heroDescriptions` to verify hero-consistency plumbing)
   - `actions` → 3 actions with controlled `stat` + `sceneFit` so outcomes are
     deterministic: warrior `strength good` + dice 6 = success; `strength risky`
     + dice 1 = failure (wizard has strength 1)
   - `outcome` → echo `outcome/damageTaken/bossDamage` into the narrative to
     assert what the server was told
   - `loot` → `{ name: '...' }`
2. **Skip onboarding** by seeding localStorage key `family-quest-storage`
   (zustand persist format `{ state: {...}, version: 2 }`) with players,
   characters, `selectedPlayerIds`, settings — then `goto /play`.
3. **Play turns**: `Choose Action` → click a mocked action → physical dice grid
   (`button:text-is("6")`) → `Continue Adventure →` → drain reward modals
   (loot chest / level-up / victory). The chest button animates forever —
   click it with `{ force: true }`.

## Flows worth driving

- Success + dice ≥4 → loot chest; dice 6 → rare (+2)
- 6 XP (two successes) → level-up card picker
- Failure → −1 HP; during boss → −2 HP; 0 HP → KO → rescue banner + half-HP
  revive on the next scene
- Boss arrives after `partySize × 4` recorded turns (party bar + boss banner,
  HP = `partySize × 3 + 2`); boss at 0 → victory overlay
- Reload mid-adventure → levels/gear persist (zustand persist v2)

A ready-made driver script exists in the session scratchpad as
`drive-game.js` if you're continuing a session; otherwise rebuild from the
notes above (~150 lines).

## Gotchas

- To force chest contents deterministically, pin `Math.random` via
  `page.evaluate` ONLY around the dice tap and restore right after —
  pinning it page-wide (addInitScript) freezes framer-motion's phase
  transitions and the action picker never renders.
- `getByRole('button', {name: 'Luk'})` substring-matches hero names like
  "Lukas" — use `exact: true` for the close buttons.

- `tests/` has unit coverage for all pure game logic (`npx vitest run`) — but
  that's CI's job, not verification.
- Real image generation needs `GOOGLE_AI_API_KEY` with access to
  `gemini-3-pro-image-preview` (falls back to `gemini-2.5-flash-image`);
  cannot be verified in a keyless container.
