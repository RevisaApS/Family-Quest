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

## 2026-09-06 · run 4 · PR #22
**Read:** ledger runs 0–3, `BACKLOG.md` (no play notes yet). Run by hand in
the same session; branch as before.
**Hypothesis:** If "Gem og afslut" leaves one hanging sentence that the twins
see on the home card and hear again at resume, then the next session gets
asked for.
**Shipped:** backlog #7. Tapping *Gem og afslut* now shows *"✍️ Fortælleren
skriver en sidste linje..."* for a moment while a new prompt writes one
sentence in the story's language that teases the very next moment ("Men under
broen åbner et gult øje sig..."). The line is tidied to one sentence that
trails off, saved on the slot, shown in italics on the home card, and read
again at the bottom of *"Sidst i eventyret..."* (🌙). If the storyteller fails
or takes more than five seconds, a canned Danish line naming the villain is
used instead (*"Men et sted i mørket venter Skyggekongen stadig..."*), so the
save never waits longer. A re-save with no progress keeps the line; a save
after the story has moved on drops it, so a stale hook is never read. Old
slots without a line render as before. **One new text-AI call per save**, off
the turn path, with a hard cap and a fallback. Merged.
**Verified:** vitest 222/222 (7 new: `tests/lib/game/cliffhanger.test.ts`,
four slot tests) · tsc clean · eslint 16, unchanged · drove three save paths
at 1024×768 with mocked AI: a quoted two-sentence answer became one tidied
line on the home card and on the recap after resume; a 500 gave the canned
villain line; a hung call saved in ~5.2 s with the canned line. The real
prompt could not be exercised (no key); the tidier makes any one-sentence
answer safe to show. Screenshots in `shots/run-4/`.
**Watch for at the table:** do the twins read the line on the home card and
ask about it ("hvad var det gule øje?!"), and does the AI's line actually
point at something from their story rather than a generic omen? If it reads
generic, tighten the prompt with the last scene's nouns.
**Left out / next:** nothing entertains the *first* scene's wait (castle);
the Continue gate on outcome prose (#2b) is still open; #4 (name the chest
owner) is tiny. **Four runs have shipped without a play note.** Stop here
until one exists: the next run should be built from what the table said.
**Open question for Steven:** none.

---

## 2026-09-06 · run 3 · PR #21
**Read:** ledger runs 0–2, `BACKLOG.md` (no play notes yet). Run by hand in
the same session; branch as before.
**Hypothesis:** If resuming a saved adventure opens with "Sidst i eventyret…"
and the last three things that happened, then the twins are back in the story
(and remember the villain's name) before the first roll.
**Shipped:** backlog #6. Opening a saved slot, or reloading the iPad
mid-story, now shows a parchment page: *"📖 Sidst i eventyret..."*, the quest
title and goal, *"Skurken: Skyggekongen"*, the last three beats as
*"Hero: what happened"* with 🎉 / ⚡ / 🔄 for how the roll went, *"Næste tur:
Mason Måneskin"*, and a *"Videre! →"* button. It is built from the story
memory the game already keeps, so there is no AI call and no wait; the next
scene is written underneath while Far reads, and appears the instant Videre
is tapped. A brand-new adventure skips it. Merged.
**Verified:** vitest 215/215 (4 new, `tests/lib/game/recap.test.ts`) · tsc
clean · eslint 16, unchanged · drove a resumed slot at 1024×768 with mocked
AI: recap shows the right three beats (not the fourth), quest, villain and
next hero; no castle and no new scene leak through while it is up; Videre
reveals the already-loaded scene in under 100 ms; a fresh adventure shows no
recap. Screenshots in `shots/run-3/`.
**Watch for at the table:** does Far actually read it aloud, and do the twins
correct or add to it ("nej, det var MIG der…")? That back-and-forth is the
point. If they skip past it every time, shorten to two beats.
**Left out / next:** the recap knows only outcome lines, not scene text (the
memory does not keep scenes). No cliffhanger yet on "Gem og afslut" (#7) —
that is the natural pair to this and the next between-session hook. Runs 1–3
have all shipped without a play note; the next run should be the first one
after a real session.
**Open question for Steven:** none.

---

## 2026-09-05 · run 2 · PR #20
**Read:** ledger runs 0–1, `BACKLOG.md` (still no play notes). Run by hand in
the same session as run 1; branch as in run 1.
**Hypothesis:** If the twin who isn't rolling can bet on the d20 before it
lands, then during their sibling's turn they watch the die instead of
drifting.
**Shipped:** backlog #3. In the dice phase the off-turn kid sees
*"🔮 Mason Måneskin, gæt terningen!"* with two big buttons, *Højt (11–20)* and
*Lavt (1–10)*; tapping again takes the guess back. When the die lands, the
outcome card gets a line: *"🔮 Mason Måneskin gættede rigtigt!"* (green) or
*"…ikke denne gang!"*, and from the second right guess in a row *"i træk ×2"*.
Knocked-out heroes can guess too. The reward is the cheer and the streak
only: no gold, no XP, no roll bonus, so the economy the simulator tuned is
untouched. Streaks live in component state for one sitting and are not
persisted. Merged.
**Verified:** vitest 211/211 (3 new, `tests/lib/game/prediction.test.ts`) ·
tsc clean · eslint 16, unchanged · drove three turns at 1024×768 with mocked
AI: the prompt shows only for the non-acting kid and swaps with the turn; a
wrong guess, a right guess and a right-after-wrong all read correctly; gold
stayed at 1 for both heroes. Screenshots in `shots/run-2/`.
**Watch for at the table:** does the off-turn twin actually tap a guess most
turns, and does he look at the die when it lands? If they start guessing on
their own roll's odds instead ("kan jeg klare 12?"), that is a sign to try
the "Klarer han det? Ja/Nej" variant.
**Left out / next:** the guess is not told to the outcome prompt (a cheer in
the narration would be nice and is one prompt line). Streaks reset on reload.
Next run: #4 (name the chest owner) is tiny; #6 (the "Sidst…" recap on
resume) is the first between-session hook. Prefer #6 unless a play note says
otherwise.
**Open question for Steven:** none.

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
