---
updated: "2026-09-05"
---
# Digest

> The contract: 1 page, hard cap. This is the first file a visiting repo reads; deeper dives are targeted from its map. Refresh at natural checkpoints; readers flag it stale after 14 days.

## Current focus

The app is live in production (Vercel, auto-deploy from `main`, ~30s to Ready); development happens via claude.ai cloud sessions that open PRs. The last feature work landed 2026-07-27 (values layer, XP/gold economy, hero-portrait memory, visible inventory). Since then: housekeeping (docs into `docs/`, rules into `AGENTS.md`), and on 2026-09-05 a standing **engagement loop** — a brief (`/engagement-loop` skill), a ranked backlog and a run ledger under `docs/loops/engagement/`, fed by Steven's play notes in `docs/playtests/`. Each run ships one small verified change toward "the twins ask to play again". Not yet scheduled as a routine; runs by hand until Steven turns it on. No feature branch is in flight.

## Active

- Family Quest is a kids' family D&D-style RPG (Steven narrating in Danish for the twins, ~8–10, on one shared iPad): AI-generated scenes/portraits/art, a d20 quest arc with monsters and boss phases, XP/levels/skills, a gold shop, inventory, pets, epilogues and a Hall of Heroes.
- Shipped and live: XP/levels/signature moves and co-op assist; a gold economy; loot and inventory that shows up in the generated art; an invisible stoic-values layer (one theme per adventure, villain embodies its opposite, epilogue never names the lesson).
- Stack: Next.js 16 + TypeScript, Gemini for text and images, zustand + localStorage for persistence. Supabase is installed but dormant — nothing reads it at runtime.
- Family-only build for now: the MVP PRD's commercial track (subscribers, pricing, external users) is dormant — decided 2026-07-30.
- `main` is production — anything merged deploys within ~30s, possibly mid-session while the kids are playing.

## Open questions

- Do the four stoic themes hold up in real play, or does one need substituting? Explicitly parked for Steven "after real sessions" (`docs/brainstorms/2026-07-24-values-layer-in-family-quest.md`).
- Post-vacation backlog, still unaddressed in code: Danish TTS, scene images at key story moments, content red-teaming before anyone outside the family plays (`docs/brainstorms/2026-07-03-vacation-play-readiness.md`).

## Next milestone

Write the first play note after a real session, then let the engagement loop run weekly from it. (The old "Phase 3" custom action already shipped 2026-07-06 as "Min egen idé!" — the loop's backlog is the live to-do list now, not the 2026-07-03 spec.)

## Where things live

- Project rules & dev workflow → `AGENTS.md` (`CLAUDE.md` is just an include of it)
- Discovery docs & PRD → `docs/discovery/` (the MVP PRD is `09-mvp-prd.md`); current thinking → `docs/specs/`, `docs/plans/`, `docs/brainstorms/`
- App code → `src/`; game logic → `src/lib/game/`; kid-facing text is Danish via `src/lib/i18n.ts` (imported as `@/lib/i18n`)
- Tests → `tests/` (`npx vitest run --exclude "tests/integration/**"`); `supabase/` holds schema/migrations but is not used at runtime
- Merging to `main` = production deploy (Vercel) — the URL the kids play on
