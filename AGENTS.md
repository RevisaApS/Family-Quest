<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Family Quest — project rules

Family Quest is a kids' family D&D-style RPG (Steven + his twins Lucas & Mason, ~8–10, on one shared iPad; Steven narrates aloud in Danish). It's a Next.js + TypeScript app: AI-generated scenes/actions/portraits/scene-art, a d20 quest arc with monsters and boss phases, XP/levels/skills, a gold shop, inventory, pets, epilogues and a Hall of Heroes.

## Source of truth & workflow (READ FIRST)

- This app is developed mainly via **claude.ai cloud sessions that open PRs to GitHub**. Local checkouts go stale fast.
- **Before doing ANY work: `git fetch origin` and compare `main` vs `origin/main`.** `origin/main` is the source of truth — never build on a stale local `main`. If they diverge, reconcile before writing code.
- Deploys go to Vercel (CLI / GitHub connect). **Never push or deploy without asking.**

## Conventions

- Kid-facing text is **Danish**, via the i18n layer — use `t()` / `classLabel()` from `@/lib/i18n`; never hardcode user-visible strings. UI chrome may stay English.
- Image prompts are always **English** regardless of story language (see `@/lib/game/appearance.ts`).
- Models: text/JSON `gemini-3.5-flash`; images `gemini-3-pro-image-preview` (fallback `gemini-2.5-flash-image`). Persistent store is **localStorage** (zustand persist) — Supabase is wired but unused at runtime.
- Portrait / scene-image / item-image calls cost **real Gemini credits** — do **not** run playthroughs or smoke tests that burn credits without asking first.

## Architecture

- Game logic: `src/lib/game/` (`rpg`, `skills`, `loot`, `shop`, `pets`, `mechanics` — d20 resolution, `appearance`).
- AI: prompt builders in `src/lib/ai/`, exposed via route handlers in `src/app/api/ai/`.
- `src/app/play/page.tsx` orchestrates the turn loop and its modals (level-up, loot chest, shop, victory, epilogue).
- Tests: `npm run test:run` (vitest). Add tests for any new deterministic game logic.
