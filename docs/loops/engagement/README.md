# The engagement loop

A standing, autonomous improvement loop with one goal: **the twins ask to play
again.** Each run is one small, verified, kid-felt change to the game, shipped
end to end, with a ledger entry a stranger could pick up from.

## Files

| File | Who writes it | What it is |
|---|---|---|
| `.claude/skills/engagement-loop/SKILL.md` | Steven (rarely) | The brief: goal, rails, the run procedure, the merge bar. Invocable as `/engagement-loop` in any Claude Code session on this repo. |
| `docs/loops/engagement/BACKLOG.md` | the loop | Ranked hypotheses. Re-ranked every run. |
| `docs/loops/engagement/LEDGER.md` | the loop | One entry per run, newest first. The loop's memory across fresh sessions. |
| `docs/playtests/*.md` | Steven | Five-minute notes after a real session. The loop's only window onto the table; a play note outranks the backlog. |

## Running it

**By hand**, in a Claude Code session on this repo:

```
/engagement-loop
```

**On a schedule**, as a Claude Code routine that opens a fresh cloud session
each time. Weekly is the right cadence: the loop needs a play session between
runs to learn anything, and the family plays roughly once a week. A midweek
night gives Steven the weekend to play and Monday or Tuesday to jot a note.

Routine prompt (standalone; a fresh session has no memory of this conversation):

```
Run Family Quest's engagement loop.

The repo is StevenValentin/FamilyQuest, already cloned in the working directory.
Start with `git fetch origin` and read AGENTS.md. Then open
.claude/skills/engagement-loop/SKILL.md and follow it end to end: read the
ledger and any new play notes, pick exactly one slice, build it, verify it in
the driven app with mocked AI, ship it on a branch named
loop/engagement-<today's date>, open the PR, apply the merge bar, and write the
ledger entry. Nobody is watching this session: do not ask questions, make the
calls the brief tells you to make, and record anything you are unsure about in
the ledger for Steven. If there is nothing worth shipping this week, say so in
the ledger and stop; a run that ships nothing is better than a run that ships
noise.
```

Suggested schedule: Wednesdays 02:00 UTC (04:00 in Copenhagen in summer, 03:00
in winter), so a fix lands before the weekend and never while anyone is playing.

## Stopping it

Disable or delete the routine. The files stay; `/engagement-loop` still works by
hand.
