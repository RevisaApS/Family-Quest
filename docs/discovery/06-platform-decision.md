# Phase 6: Platform Decision

## Executive Summary

| Recommendation | Rationale | Confidence |
|----------------|-----------|------------|
| **PWA + Lovable + Supabase** | Fastest MVP path for PM learning to code | High |
| Backup Option | Expo (React Native) if native features needed later | Medium |

**Bottom Line:** Start with a Progressive Web App built using Lovable and Supabase. Your "screen-light" design philosophy actually makes PWA's traditional limitations irrelevant—users aren't meant to stare at the screen anyway.

---

## Platform Options Analyzed

### Option 1: Progressive Web App (PWA)
**Build Tool:** Lovable + manual code in Cursor

| Pros | Cons |
|------|------|
| Single codebase for all devices | iOS Safari has some audio limitations |
| No app store approval needed | Can't access some native features |
| Instant updates (no review cycle) | Not discoverable in app stores |
| Lovable outputs React/TypeScript | Less "app-like" feel |
| Can "install" to home screen | Background audio can be interrupted |
| Works on any device with browser | |
| Fastest time-to-MVP | |

### Option 2: Native Mobile Apps
**Build Tool:** Swift (iOS) + Kotlin (Android)

| Pros | Cons |
|------|------|
| Best performance | Two separate codebases |
| Full device access | Requires significant coding skill |
| App store discoverability | Long approval cycles for updates |
| Best audio/TTS control | Most expensive and slow to develop |
| | Not realistic for PM learning to code |

### Option 3: Cross-Platform (Expo/React Native)
**Build Tool:** Expo with EAS Build

| Pros | Cons |
|------|------|
| Single codebase, native feel | Steeper learning curve than Lovable |
| Full native device access | Requires more coding knowledge |
| OTA updates for JS changes | Build configuration complexity |
| Large ecosystem | Debugging can be complex |
| App store presence | |

### Option 4: Cross-Platform (Flutter)
**Build Tool:** Flutter SDK

| Pros | Cons |
|------|------|
| Best performance | Must learn Dart (new language) |
| Pixel-perfect UI control | No OTA updates |
| Web + mobile from one codebase | AI tooling less effective for Dart |
| Strong Google backing | Larger app size |
| | Higher learning curve |

---

## Your Specific Context

### Technical Profile
- **Role:** PM learning to code
- **Tools Available:** Claude Code, Cursor, Lovable, Supabase
- **Time Commitment:** Side project
- **Experience:** Not a developer (yet)

### App Requirements vs Platform Capabilities

| Requirement | PWA | Native | Expo | Flutter |
|-------------|-----|--------|------|---------|
| Danish TTS (via ElevenLabs API) | YES | YES | YES | YES |
| Image Generation (via API) | YES | YES | YES | YES |
| LLM Story Generation (via API) | YES | YES | YES | YES |
| Physical Dice Input (text/voice) | YES | YES | YES | YES |
| Audio Playback | GOOD* | BEST | GOOD | GOOD |
| Offline Support | PARTIAL | FULL | FULL | FULL |
| Time to MVP | FASTEST | SLOWEST | MEDIUM | MEDIUM |
| Your Skill Match | BEST | POOR | FAIR | POOR |

*PWA audio is good enough for your use case—TTS plays, user listens, then focuses on family.

### Why "Screen-Light" Changes Everything

Your design philosophy is your secret weapon here. Traditional PWA weaknesses include:
- Background audio interruption on iOS → **Not a problem:** Family is actively engaged, not multitasking
- Less "native" feel → **Not a problem:** You WANT less screen engagement
- No push notifications → **Not a problem:** Family is together, no need to notify

The app's job is to:
1. Generate story content → API call (works anywhere)
2. Display an image → works anywhere
3. Play audio narration → works well enough in PWA
4. Accept dice roll input → simple form/voice (works anywhere)
5. Wait while family discusses → **Screen is off/dimmed**

---

## Text-to-Speech Analysis

### Danish TTS Options (2026)

| Provider | Danish Quality | Pricing | Latency | Integration |
|----------|---------------|---------|---------|-------------|
| **ElevenLabs** | Excellent | $5-22/mo (1M chars) | Low | Easy API |
| Google Cloud TTS | Good | $16/1M chars | Medium | Medium |
| Azure Neural TTS | Good | $16/1M chars | Medium | Medium |
| Amazon Polly | Fair | $4/1M chars | Medium | Medium |

**Recommendation:** ElevenLabs for quality, Google Cloud TTS as backup. Both have good Danish voices and are cloud-based—meaning they work identically whether your app is PWA or native.

### TTS Cost Estimate
- Average adventure session: ~3,000-5,000 words
- Average characters per session: ~20,000
- Sessions per month per family: 4-8
- Characters per active family per month: ~100,000

At ElevenLabs Starter ($5/mo for 30,000 chars/mo) → **Too low**
At ElevenLabs Creator ($22/mo for 100,000 chars/mo) → **Just right for heavy users**

**Business Model Note:** TTS will be your primary variable cost. Consider:
- Free tier: 2-3 adventures/month (limited TTS)
- Paid tier: Unlimited adventures (you eat TTS cost)
- Or: Per-adventure credits for heavy users

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PWA (Built with Lovable → Cursor)              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │   React     │  │  Tailwind   │  │  Local Storage/     │  │   │
│  │  │   Frontend  │  │  CSS        │  │  IndexedDB Cache    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   Auth      │  │  Database   │  │  Edge Functions             │ │
│  │   (Users)   │  │  (Postgres) │  │  (API orchestration)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌───────────┐ ┌───────────┐ ┌───────────────┐
            │  Claude   │ │ ElevenLabs│ │ Google        │
            │  (Anthro- │ │  TTS API  │ │ Imagen 4      │
            │  pic) API │ │           │ │ (Vertex AI)   │
            └───────────┘ └───────────┘ └───────────────┘
```

### Why This Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| **Frontend** | Lovable → React/TS | Fastest to working prototype for non-dev |
| **Styling** | Tailwind (Lovable default) | Clean, mobile-responsive |
| **Backend** | Supabase | All-in-one: Auth, DB, Edge Functions |
| **LLM** | Claude (Anthropic) | Story generation, content moderation |
| **TTS** | ElevenLabs | Best Danish voice quality |
| **Images** | Google Imagen 4 | $0.02/image, high quality, via Vertex AI |
| **Hosting** | Supabase + Vercel/Netlify | PWA hosting built-in |

---

## Migration Path

If you outgrow PWA, here's the upgrade path:

```
Phase 1 (NOW)          Phase 2 (IF NEEDED)         Phase 3 (SCALE)
─────────────────      ─────────────────────       ──────────────────
PWA via Lovable   →    Expo + Capacitor wrap  →   Native apps
                       (Same React codebase)       (If millions of users)

Timeline: MVP          Timeline: 6-12 months      Timeline: Year 2+
Cost: Low              Cost: Medium               Cost: High
Skill: Beginner        Skill: Intermediate        Skill: Advanced/Hire
```

**Key Point:** Lovable outputs React/TypeScript code. This same code can be wrapped with Capacitor or migrated to Expo later. You're not locked in.

---

## Development Workflow

### Recommended Approach

1. **Prototype in Lovable** (Week 1-2)
   - Describe core screens: character creation, adventure play, dice input
   - Connect to Supabase for data persistence
   - Get basic flow working

2. **Export to Cursor** (Week 3-4)
   - Pull code from Lovable to local repo
   - Add API integrations (LLM, TTS, images)
   - Refine with Claude Code assistance

3. **Test with Your Twins** (Week 5-6)
   - Deploy PWA to phone home screens
   - Run real adventures
   - Collect feedback, iterate

4. **Polish & Launch** (Week 7-8)
   - Fix issues found in testing
   - Add parent controls/settings
   - Soft launch to friends/family

### Tools & Their Roles

| Tool | Use For |
|------|---------|
| **Lovable** | Initial UI prototyping, screen layouts |
| **Cursor** | Code refinement, API integrations, debugging |
| **Claude Code** | Complex logic, prompt engineering, problem solving |
| **Supabase Dashboard** | Database design, auth config, monitoring |
| **Vercel/Netlify** | PWA hosting (or Lovable built-in hosting) |

---

## Cost Estimate (Year 1)

### Development Costs
| Item | Cost | Notes |
|------|------|-------|
| Lovable Pro | $300/year | 100 credits/mo for prototyping |
| Cursor Pro | $240/year | AI-assisted coding |
| Supabase Pro | $300/year | Database + auth + functions |
| Domain | $15/year | familydnd.app or similar |
| **Total Dev Tools** | **~$855/year** | |

### Operating Costs (Per 1,000 Active Users)
| Item | Cost/Month | Notes |
|------|------------|-------|
| ElevenLabs TTS | ~$200-500 | Depends on usage, biggest cost |
| Claude API (Anthropic) | ~$50-100 | Story generation |
| Google Imagen 4 | ~$20-50 | Scene illustrations ($0.02/image) |
| Supabase (if over free tier) | $25+ | Database growth |
| **Total Operating** | **~$300-700/mo** | Per 1,000 active users |

### Break-Even Analysis
- If 1,000 users, operating cost ~$500/mo
- At $10/mo subscription, need ~50 paid users to break even on ops
- At 5% conversion, 1,000 free users = 50 paid = break even

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| iOS PWA audio issues | Medium | Medium | Test early on iPhones; have "tap to continue" fallback |
| Lovable limitations | Medium | Low | Export code early, continue in Cursor |
| TTS costs explode | Medium | High | Implement usage limits, cache common phrases |
| User wants "real app" | Low | Medium | Wrap with Capacitor if demanded |

---

## Decision Matrix

| Factor | Weight | PWA | Native | Expo | Winner |
|--------|--------|-----|--------|------|--------|
| Time to MVP | 30% | 10 | 3 | 6 | PWA |
| Your Skill Match | 25% | 10 | 2 | 5 | PWA |
| Feature Completeness | 20% | 7 | 10 | 9 | Native |
| Future Flexibility | 15% | 7 | 8 | 9 | Expo |
| Cost | 10% | 10 | 4 | 7 | PWA |
| **Weighted Score** | | **8.6** | **5.0** | **6.7** | **PWA** |

---

## Recommendation: PWA with Lovable + Supabase

### Why This Is Right for You

1. **You're a PM, not a developer (yet)** → Lovable gets you to working prototype fastest
2. **Your differentiator is "screen-light"** → PWA limitations don't apply
3. **TTS is API-based anyway** → Same quality on any platform
4. **You need to validate with your twins first** → PWA ships to their phones today
5. **You can always upgrade later** → React code migrates to Expo if needed

### Immediate Next Steps

1. Sign up for Lovable Pro ($25/mo)
2. Create Supabase project (free tier to start)
3. Get ElevenLabs API key (free tier for testing)
4. Build first screen: "Adventure Mode" with story display + dice input
5. Test with your twins within 2 weeks

---

## Appendix: Platform Comparison Sources

- Progressier PWA vs Native Comparison (2026)
- Groovy Web: React Native vs Flutter vs Expo vs Lynx (2026)
- Softr: Lovable vs Cursor Comparison (2025)
- Multiple TTS API comparisons (Deepgram, Speechmatics, etc.)
- SoftSuave: Can Lovable Make Mobile Apps? (2025)

---

*Research conducted April 2026*
