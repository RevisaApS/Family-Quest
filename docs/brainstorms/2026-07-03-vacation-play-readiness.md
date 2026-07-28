# Vacation Play-Readiness: Brainstorm / Discovery Notes

Date: 2026-07-03 · Goal: Figure out what to improve in the family-quest app (and around it) so the family has a genuinely fun time playing D&D together at the summer house.

## Context (from project exploration, pre-interview)

- Discovery phase complete (April 2026): AI family D&D app, kids 7-13, screen-light, physical dice, Danish TTS, one shared device, CONDITIONAL GO verdict.
- `family-quest` app exists: Next.js 16 + Gemini 3 Flash + Supabase + Google Cloud TTS keys configured.
- Play loop is wired to real AI (git: "wire play page to Gemini AI, replace all mocks" + code review fixes). Tests exist for game mechanics, classes, rotation, gemini client.
- Open validation items from discovery (never checked off): Danish TTS test with the twins, paper-prototype dice interaction, kid-safety red-teaming.

## Summary / key decisions

**Situation:** Vacation starts within days. App is solo-tested only; twins (~8-10) have never played. Summer house has decent wifi. Playing setup: Steven + twins, one iPad, Steven narrates aloud, kids tap their own actions and roll physical dice.

**Scope for the vacation (agreed):**
1. **Danish story text** — pass language into all AI prompts (scene/actions/outcomes); simple vivid Danish for 8-10yo; action labels short.
2. **Deploy to Vercel** — play on iPad via URL; laptop dev server as backup. (Steven handles GitHub/Vercel logins.)
3. **Tap-friendly dice entry** — six big 1-6 buttons replace the typing field in physical mode.
4. **Physical dice as default** preference.
5. **Simple named adventure slots** — save/resume/new so each twin can have their own ongoing story.
6. **Onboarding flawless on iPad** — character creation is the night-one event.
7. **Verified end-to-end playthrough** before departure (production build + real AI smoke test).

**Explicitly cut / declined:**
- TTS voice narration (broken today; Steven narrates — fix post-vacation).
- Scene images (screen-light; text-only).
- Quest arc / ending mechanics (endless is fine; Steven improvises conclusions).
- Content safety spot-check (style prompt + live parental narration deemed sufficient).

**Execution:** Steven chose "start now" — implement in this session, he reviews and handles external logins.

## Q&A log

### Q1: Timeline
- Asked: When does the vacation start — how much working time before the summer house?
- Captured: **Within days** (this week). Confirmed the recommended guess.
- Implication: Ruthless prioritization. Goal = one full playthrough works reliably. Skip nice-to-haves unless they're cheap.

### Q2: Playtest state
- Asked: Has a full adventure been played through the app yet — kids or solo?
- Captured: **Solo-tested only.** Steven has clicked through it himself post-AI-integration; the kids have NOT played a real session.
- Implication: Kid-facing issues (pacing, language level, boredom points, turn fairness) are undiscovered. A pre-vacation family test-run at home would be the highest-value single action if there's even one evening for it.

### Q3: Players
- Asked: Who's playing at the summer house — how many kids, what ages?
- Captured: **Steven + twins, roughly 8-10 years old.** One shared device, matching the discovery design assumption.
- Implication: 3 players total. Reading level must suit ~8-10yo; turn rotation between 2 kids + 1 adult; session length target 30-60 min per discovery.

### Code findings (explored instead of asked)
- **Language toggle is cosmetic**: `language-toggle.tsx` holds local useState; nothing consumes it. Story/action/outcome prompts are English-only. The game always plays in English today.
- **TTS is likely broken**: `src/lib/ai/tts.ts` calls plain `gemini-2.5-flash` expecting inline audio back — that model doesn't produce audio. `GOOGLE_CLOUD_TTS_API_KEY` exists in .env.local but is never used by code. Narration audio almost certainly returns null silently.
- Adventure styles exist (whimsical 4-7 / realistic 7-12 / dark 13+); "realistic" fits the twins' age band.

### Q4: Language
- Asked: What language must the adventure be in for the twins?
- Captured: **Danish is needed.** English prose read aloud by/to 8-10yo Danish kids would kill the fun.
- Decision: Pass a language instruction into all AI prompts (scene, actions, outcomes). Simplest safe version: hardcode Danish or wire the existing toggle minimally. UI chrome staying English is acceptable; the story text is what matters.

### Q5: Voice narration (TTS)
- Asked: TTS is broken — fix or cut for the vacation?
- Captured: **Cut it. Steven narrates aloud.** Dad-as-DM reading the Danish text is warmer, free, offline-tolerant, and matches the "parent as co-pilot" philosophy.
- Decision: Ensure TTS failure can never block or slow the play loop (verify it fails silently). Make narration text large and readable for reading aloud. TTS repair goes on the post-vacation backlog.

### Code findings 2 (explored instead of asked)
- **App is local-only**: no git remote, no .vercel config, no PWA manifest in public/ (despite a "deployment prep" commit). It currently runs only via `npm run dev` on Steven's laptop.

### Q6: Connectivity at the summer house
- Asked: Internet situation? (App is 100% dependent on live Gemini calls.)
- Captured: **Decent wifi/4G available.** App works as designed; add graceful retry for hiccups rather than an offline mode.

### Q7: Device & hosting
- Asked: How should the family play it at the summer house, given the app is laptop-only today?
- Captured: **Deploy to Vercel, play on iPad in the browser.** Pass-around tablet fits the screen-light one-device design. Laptop with `npm run dev` stays as backup.
- Work implied: create git remote, connect Vercel, set env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_AI_API_KEY, GOOGLE_CLOUD_TTS_API_KEY), verify production build passes, test on iPad Safari specifically (touch targets, viewport).

### Code findings 3 (explored instead of asked)
- **No end condition** in the play loop — adventures run forever, no finale/victory scene.
- **Images are wired backend-side** (fetchImage hook + /api/ai/image route) but the play page never calls them — scenes are text-only today.
- **State persists** across reloads via zustand persist → localStorage. Story survives an iPad Safari tab reload on the same device.

### Q8: Session endings
- Asked: How should a session conclude, given the loop is endless?
- Captured: **Endless is fine.** Steven (as narrator/DM) will improvise conclusions and decide when to stop. Explicitly declined the quest-arc/finale build. Zero work.
- Note: went against my recommendation — respect this; do NOT build ending mechanics.

### Q9: Scene images
- Asked: Add scene images to the play page or stay text-only?
- Captured: **Stay text-only.** Screen-light philosophy; kids imagine while Steven narrates. Avoids latency, cost, and a failure mode. Zero work.

### Q10: Kid interaction model
- Asked: How hands-on are the twins with the iPad during play?
- Captured: **Kids pick & roll.** Steven reads narration aloud; each twin reads their own action options, taps their choice, rolls a physical d6, enters the result.
- Implications:
  - Action option text must be SHORT and in simple Danish (prompt constraint).
  - Dice result entry should be six big tap buttons (1-6) instead of the current type-a-number field — typing on iPad number input is clunky for kids.
  - Touch targets generally sized for 8-10yo fingers on the play screen.

### Q11: Backstop — what else matters
- Asked: Anything not yet covered that matters for vacation fun? (multi-select)
- Captured: Two additions:
  1. **Multiple saved adventures** — kids will want separate ongoing stories; today starting fresh wipes the single localStorage slot.
  2. **Character setup as an event** — character creation night one is part of the fun; onboarding must work flawlessly on iPad.
- Explicitly NOT selected: content safety spot-check (Steven accepts the 'realistic' style prompt as sufficient; he's narrating live and can filter).

### Q12: Save-slot scope & execution
- Asked: How minimal can multiple adventures be? And should implementation start now?
- Captured: **Simple named slots** (save current under a name, start new, resume any — full state snapshot per slot). **Start implementing now**; Steven reviews and handles Vercel/GitHub logins when prompted.

### Smoke test finding (CRITICAL)
- **Both Google API keys in .env.local are invalid** (rejected with API_KEY_INVALID even on the free models-list endpoint). The app cannot generate a single scene with these keys — it would have failed on night one at the summer house.
- Action required from Steven: create a fresh API key at https://aistudio.google.com/ (Get API key), put it in `family-quest/.env.local` as `GOOGLE_AI_API_KEY=...`, and later also in Vercel env vars.

## Implementation results (same session, 2026-07-03)

All agreed scope was implemented, tested (29/29 unit tests, clean production build), committed, and deployed:

- **Danish AI prompts** — `language` setting (default `da`) threads store → StoryContext → all three prompts; short-action constraint added; selectable Dansk/English in settings.
- **Dice** — physical mode is six big tap buttons (1-6); physical is the default; localStorage migration aligns existing devices.
- **Adventure slots** — save (named, from pause menu), resume/delete (home screen), auto-save on switch/new so a story can never be lost. Fixed latent bug: "Begin Your Journey" previously continued the old story silently.
- **Deployed** — private repo github.com/StevenValentin/family-quest; live at **https://family-quest-xi.vercel.app** (all routes 200; PWA manifest works for Add to Home Screen).
- **Smoke tooling** — `tools/smoke_test_ai.py` verifies scene→actions→outcome in Danish with one command.
- See `family-quest/DEPLOY.md` for the remaining manual steps.

## Open flags (pending input)
- ~~CRITICAL: new Google AI API key~~ **RESOLVED 2026-07-03**: Steven added a working key to .env.local; Claude added it to Vercel Production env. Deploys were then blocked by an invalid git author email (`...@ECI-G4HH3XF54H.local`) — fixed by setting the GitHub noreply address as repo-local git user.email and redeploying. **Production smoke test PASSED end-to-end in Danish** at https://family-quest-xi.vercel.app (scene → actions → outcome; all routes 200; manifest at /manifest.webmanifest).
- Minor cleanup: delete the misnamed `familyquest` env var in the Vercel dashboard (leftover from a name/value mix-up; the real `GOOGLE_AI_API_KEY` is set) -> Steven
- **Before departure: one real family test-run at home** — kids have never played; one evening of play at home surfaces pacing/language issues while there's still time to fix them -> Steven
- Optional: connect GitHub in the Vercel dashboard for push-to-deploy (CLI deploys work without it) -> Steven
- Post-vacation backlog: fix TTS (Google Cloud TTS da-DK), quest-arc endings, scene images at key moments, content red-teaming before any external users -> Steven
