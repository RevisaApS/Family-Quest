# Family Quest — project docs

Background thinking behind the app. Code lives in `src/`; the rules agents must
follow live in `AGENTS.md`.

## A note on the name

This project was worked on as **"D&D Family Roleplay"** through the discovery
phase — that was the working title, and it's the name in the header of
`discovery/00-discovery-summary.md`. The product was christened **Family Quest**
in `discovery/09-mvp-prd.md` (April 2026), and everything since — the repo, the
GitHub project, the Vercel deployment — uses that name. Discovery phases 01–08
predate the name, so they never mention it; they describe the same product.

## Layout

| Folder | What's in it |
|---|---|
| `discovery/` | The 11-phase discovery run: problem brief, validation, market sizing, competitive landscape, user intelligence, platform decision, risk mapping, synthesis, MVP PRD, design brief |
| `specs/` | Design specs, dated — MVP, play-loop AI integration, engagement layer |
| `plans/` | Implementation plans that follow from those specs |
| `brainstorms/` | Raw discovery notes, plus `wireframes/` — the HTML mockups from brainstorming sessions (open them directly in a browser) |
| `loops/` | Standing autonomous improvement loops. `loops/engagement/` holds the engagement loop's backlog and run ledger; its brief is the `engagement-loop` skill under `.claude/skills/` |
| `playtests/` | Steven's five-minute notes after real sessions with the twins — the only signal that reaches the loops from the table |
| `wat-framework.md` | The generic Workflows/Agents/Tools framework notes this project was started under. Kept for reference; the operative rules for this repo are in `AGENTS.md` |

Docs are dated in their filenames where the date matters. They record what was
true when written — treat an old plan as history, not as current instruction.
