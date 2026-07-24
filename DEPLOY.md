# Deployment — Family Quest

**Live app:** https://family-quest-xi.vercel.app
**GitHub (private):** https://github.com/StevenValentin/family-quest
**Vercel project:** family-quest (team: stevenvalentin-vismacoms-projects)

## Deploying

**Pushing to `main` deploys to production.** The GitHub–Vercel connection is
live: a push produces a Ready production deployment roughly 30 seconds later,
with no CLI step. Treat `git push origin main` as "publish".

```bash
git push origin main            # this IS the deploy
vercel ls family-quest --prod   # confirm the new build went Ready
```

If you ever need to deploy without pushing (a local-only experiment, or GitHub
being down):

```bash
vercel deploy --prod --yes
```

## Preflight before a session

Run this the night before you play. It calls the real Gemini API through the
app's own code, so it catches an expired key, a renamed model, or a scene that
comes back unparseable:

```bash
set -a && . ./.env.local && set +a && npx vitest run tests/integration
```

Six checks must pass. Without a key in the environment the suite skips itself,
so plain `npx vitest run` (108 unit tests) stays offline and free.

Then open the live URL on the iPad and play one full turn — scene → action →
dice → outcome.

## Models

| Use | Model | Notes |
|-----|-------|-------|
| Story, actions, outcomes, epilogue | `gemini-3.5-flash` | Thinking is disabled — three of these run per turn and thinking tripled the wait for no gain in quality |
| Scene and item art | `gemini-3-pro-image-preview` | Falls back to `gemini-2.5-flash-image` |

All of them use the same `GOOGLE_AI_API_KEY`. If images don't appear the story
still works; check the Vercel function logs for which image model failed.

Every JSON call sends a `responseSchema`. Without one this model returns
JSON that `JSON.parse` rejects in roughly a quarter of calls, so if you add a
new AI call, give it a schema.

## iPad setup

1. Open https://family-quest-xi.vercel.app in Safari.
2. Share → **Add to Home Screen**. You get the d20 icon, and it launches
   fullscreen with no Safari chrome.
3. Adventures live in that device's browser storage. Same iPad, same browser,
   and don't clear website data.
4. Turn off Auto-Lock for the evening (Settings → Display & Brightness →
   Auto-Lock → Never). The app can't hold the screen awake by itself, and it
   will sleep mid-story otherwise.

## Env vars reference

| Variable | Needed? | Where |
|----------|---------|-------|
| `GOOGLE_AI_API_KEY` | **Yes — everything depends on it** | `.env.local` + Vercel |
| `GOOGLE_CLOUD_TTS_API_KEY` | No (TTS is cut; no code reads it) | — |
| `NEXT_PUBLIC_SUPABASE_*` | No (Supabase is not used at runtime) | — |

Add or rotate the key in Vercel at
https://vercel.com/stevenvalentin-vismacoms-projects/family-quest/settings/environment-variables
(name `GOOGLE_AI_API_KEY`, environment **Production**), then redeploy so it
takes effect.
