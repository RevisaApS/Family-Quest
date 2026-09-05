# Engagement loop — ledger

Append-only. One entry per run, newest first. A fresh session reads the top
three entries before it does anything else, so write for a reader with no
context: what shipped, why, what to watch for at the table, what's next.

Entry template:

```markdown
## 2026-09-10 · run 3 · PR #NN
**Read:** play notes 2026-09-07 (drift during shop), ledger runs 1–2.
**Hypothesis:** If <change>, then during <moment> the twins will <behaviour>.
**Shipped:** one line on what changed, kid's-eye view. Merged / left open (why).
**Verified:** vitest N/N · tsc clean · drove <flow> with mocked AI · screenshots in PR.
**Watch for at the table:** the one thing Steven should notice next session.
**Left out / next:** what the slice deliberately did not do; what the next run should look at first.
**Open question for Steven:** (omit if none)
```

---

## 2026-09-05 · run 1 · PR #19
**Read:** ledger run 0, `BACKLOG.md` (no play notes exist yet). Run by hand in
the session that built the loop, on the session's branch rather than
`loop/engagement-2026-09-05`; the procedure otherwise as the brief says.
**Hypothesis:** If the finished page (scene, picture, what happened) stays on
screen while the next scene is written, then between turns the twins keep
talking about what just happened instead of watching a castle bounce.
**Shipped:** backlog #1 and #2a. The bouncing castle now appears only before the
very first page of an adventure. After every other "Eventyret fortsætter →" the
page they just played stays visible, dimmed, under a small pulsing strip:
*"✍️ Fortælleren skriver næste side..."*. The reward cards (chest, level-up,
victory) now sit over that page too. Separately, when the storyteller cannot be
reached the outcome line is now Danish (*"Historien fortsætter..."*), not
English. Merged.
**Verified:** vitest 208/208 · tsc clean · eslint 16 problems, unchanged from
baseline · drove two turns at 1024×768 with mocked AI and a 4 s scene delay:
between-turn state shows the previous scene and outcome and the strip, no
castle; the next scene replaces it cleanly; a failed outcome call shows the
Danish line and no English. Before/after in `shots/run-1/`.
**Watch for at the table:** in the seconds after a Continue tap, do the twins
keep talking about the roll, or go quiet the way they used to? Also whether the
dimmed page ever confuses anyone into thinking it is the new scene (the strip
and the dimming are the only cues).
**Left out / next:** nothing entertains the *first* scene's wait; the outcome
Continue button is still gated on the prose (#2b). Next run: #3, the off-turn
twin's bet, but design the reward so gold stays as the simulator tuned it (see
the note added to #3).
**Open question for Steven:** none.

---

## 2026-09-05 · run 0 · setup
**Read:** the whole repo, `docs/specs/2026-07-03-family-quest-engagement-design.md`,
both brainstorms, the commit history, and the unmerged branches.
**Shipped:** the loop itself — this ledger, `BACKLOG.md`, `docs/playtests/`, and
the brief at `.claude/skills/engagement-loop/SKILL.md`. No game code changed.
**Watch for at the table:** nothing new yet. Write the first play note.
**Left out / next:** run 1 should start at the top of `BACKLOG.md` unless a play
note says otherwise.
