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

## 2026-09-05 · run 0 · setup
**Read:** the whole repo, `docs/specs/2026-07-03-family-quest-engagement-design.md`,
both brainstorms, the commit history, and the unmerged branches.
**Shipped:** the loop itself — this ledger, `BACKLOG.md`, `docs/playtests/`, and
the brief at `.claude/skills/engagement-loop/SKILL.md`. No game code changed.
**Watch for at the table:** nothing new yet. Write the first play note.
**Left out / next:** run 1 should start at the top of `BACKLOG.md` unless a play
note says otherwise.
