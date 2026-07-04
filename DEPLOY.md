# Deployment — Family Quest

**Live app:** https://family-quest-xi.vercel.app
**GitHub (private):** https://github.com/StevenValentin/family-quest
**Vercel project:** family-quest (team: stevenvalentin-vismacoms-projects)

## ⚠️ RPG update (July 2026): redeploy needed

The RPG update (scene images, levels, skills, loot, boss fights, sounds) only
goes live after a redeploy from a machine with the Vercel login:

```bash
git pull
vercel deploy --prod --yes
```

Scene images use `gemini-3-pro-image-preview` (Nano Banana Pro) and fall back
to `gemini-2.5-flash-image` — both use the same `GOOGLE_AI_API_KEY`. If images
don't appear, the story still works; check the Vercel function logs for which
image model failed.

## ⚠️ Before the vacation: 2 manual steps

The app is deployed but **cannot generate stories yet** — both Google API keys
in `.env.local` are invalid (Google rejects them with API_KEY_INVALID).

### 1. Create a fresh Google AI API key

1. Go to https://aistudio.google.com/ → **Get API key** → create key.
2. Paste it into `family-quest/.env.local` as `GOOGLE_AI_API_KEY=...` (for local play).
3. Add the same key in Vercel: https://vercel.com/stevenvalentin-vismacoms-projects/family-quest/settings/environment-variables
   — name `GOOGLE_AI_API_KEY`, environment **Production**.

### 2. Redeploy and verify

```bash
cd family-quest
vercel deploy --prod --yes        # redeploy so the env var takes effect

npm run dev                       # in one terminal
python3 ../tools/smoke_test_ai.py # in another — must print ALL STEPS PASSED
```

Then open https://family-quest-xi.vercel.app on the iPad and play one full
turn (scene → action → dice → outcome) before you pack.

## How deploys work now

- Deploys are pushed **from your laptop** with `vercel deploy --prod --yes`.
- Auto-deploy on git push is NOT set up: your Vercel account has no GitHub
  login connection. Optional fix (dashboard → Settings → Git → connect GitHub),
  not needed for the vacation.

## iPad setup at the summer house

1. Open https://family-quest-xi.vercel.app in Safari.
2. Share → **Add to Home Screen** — the app runs fullscreen (PWA manifest is configured).
3. Adventures save to that device's browser storage. Keep using the same
   iPad + same browser, and don't clear website data.

## Env vars reference

| Variable | Needed? | Where |
|----------|---------|-------|
| `GOOGLE_AI_API_KEY` | **Yes — everything depends on it** | `.env.local` + Vercel |
| `GOOGLE_CLOUD_TTS_API_KEY` | No (TTS is cut for now; code doesn't read it) | — |
| `NEXT_PUBLIC_SUPABASE_*` | No (Supabase is not used at runtime) | — |
