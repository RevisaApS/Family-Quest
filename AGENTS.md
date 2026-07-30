<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Family Quest — project rules

Family Quest is a kids' family D&D-style RPG (Steven + his twins Lucas & Mason, ~8–10, on one shared iPad; Steven narrates aloud in Danish). It's a Next.js + TypeScript app: AI-generated scenes/actions/portraits/scene-art, a d20 quest arc with monsters and boss phases, XP/levels/skills, a gold shop, inventory, pets, epilogues and a Hall of Heroes.

Older docs use a different name: this was worked on as **"D&D Family Roleplay"** through discovery and only became Family Quest in `docs/discovery/09-mvp-prd.md`. Same project.

## Source of truth & workflow (READ FIRST)

- This app is developed mainly via **claude.ai cloud sessions that open PRs to GitHub**. Local checkouts go stale fast.
- **Before doing ANY work: `git fetch origin` and compare `main` vs `origin/main`.** `origin/main` is the source of truth — never build on a stale local `main`. If they diverge, reconcile before writing code.

# Shipping changes

Finish the job without being asked: once the work is verified, commit, push,
open the PR, and merge it (squash). Steven doesn't want to ask for the PR
every time.

Verify before merging — `npx vitest run --exclude "tests/integration/**"`,
`npx tsc --noEmit`, and, for anything that changes what the family sees,
drive the real app with the `verify` skill. Say plainly what you could not
check (image generation needs a real `GOOGLE_AI_API_KEY`).

**Know what merging does: `main` is connected to Vercel, so anything that lands
on `main` deploys straight to production** — the URL the kids actually play on,
mid-session if they happen to be playing. Confirmed 2026-07-28: a squash-merge
produced a Ready production deployment ~30s later with no CLI step. That is the
intended workflow, not a reason to stop and ask, but it does mean `main` is
never a staging area. Verify first, and leave anything risky or half-finished on
the branch.

## Conventions

- Kid-facing text is **Danish**, via the i18n layer — use `t()` / `classLabel()` from `@/lib/i18n`; never hardcode user-visible strings. UI chrome may stay English.
- Image prompts are always **English** regardless of story language (see `@/lib/game/appearance.ts`).
- Models: text/JSON `gemini-3.5-flash`; images `gemini-3-pro-image-preview` (fallback `gemini-2.5-flash-image`). Persistent store is **localStorage** (zustand persist) — Supabase is wired but unused at runtime.
- Portrait / scene-image / item-image calls cost **real Gemini credits** — do **not** run playthroughs or smoke tests that burn credits without asking first.
- `digest.md` at the repo root is the 1-page state summary other repos (LifeOS especially) read first. Refresh it when project state meaningfully changes — `/mothership:publish-digest` drives it. Never put secrets or anything kid-private in it; it crosses the repo boundary by design.
- Sibling `~/HQ` repos are readable but write-locked from here. If a change is needed in one, don't fight the lock — end the reply with a paste-ready handoff prompt for a session in that repo (the change, the exact files, the context).

## Architecture

- Game logic: `src/lib/game/` (`rpg`, `skills`, `loot`, `shop`, `pets`, `mechanics` — d20 resolution, `appearance`).
- AI: prompt builders in `src/lib/ai/`, exposed via route handlers in `src/app/api/ai/`.
- `src/app/play/page.tsx` orchestrates the turn loop and its modals (level-up, loot chest, shop, victory, epilogue).
- Tests: `npm run test:run` (vitest). Add tests for any new deterministic game logic.
- Background thinking lives in `docs/` — `discovery/`, `specs/`, `plans/`, `brainstorms/` (see `docs/README.md`). Old plans are history, not current instruction.
