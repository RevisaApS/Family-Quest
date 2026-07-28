# D&D Family Roleplay App - Discovery Research Summary

**Date:** April 2026
**Status:** ALL PHASES COMPLETE
**Verdict:** CONDITIONAL GO

---

## Executive Summary

### The Opportunity

A validated market opportunity exists for an AI-powered family D&D app targeting parents with children aged 7-13. The problem is real (parents struggle to DM for kids), people already pay for solutions (Hero Kids, AI Dungeon, storytelling apps), and no competitor owns the intersection of **family + kids + AI + screen-light design**.

### Key Metrics

| Metric | Value | Confidence |
|--------|-------|------------|
| Problem Severity | 7.5/10 | High |
| Market Size (SAM) | $50-100M | Medium |
| SOM Year 3 | $500K-1M | Medium |
| Competitive Intensity | 6/10 | Medium |
| Target Achievable (50K DKK/mo) | YES (Year 2-3) | Medium |

### Verdict: CONDITIONAL GO

Proceed with MVP development. The opportunity is validated, but success depends on:
1. Nailing the "screen-light" family experience
2. Danish/Nordic TTS quality
3. Kid-safe content moderation
4. Physical dice integration working smoothly

---

## Problem Definition

**Statement:** Parents want to facilitate engaging D&D-style adventures for young children but lack DM skills, prep time, and tools that support family interaction over passive screen consumption.

**Who:** Parents with children aged 7-13 seeking structured imaginative play that brings the family together.

**Current State:** Using Google AI Studio homebrew, struggling with full D&D rules, or giving up entirely.

**Evidence:**
- TTRPGkids.com (400+ articles, ENnie Award winning)
- Active Reddit threads with parents seeking help
- Hero Kids is a Platinum seller proving the market

---

## Target User

### Primary Persona: "Adventure Parent Alex"

**One-liner:** Geeky parent who wants to share D&D magic with kids but lacks time/skills/tools.

**Core Job:** Create magical bonding moments through imaginative play.

**Biggest Pain:** "I don't have time to prep, don't know how to simplify rules, and worry I'll mess it up."

**Price Tolerance:** $10-15/month

**Key Insight:** Parents fear "doing it wrong" more than anything—AI must be encouraging, never shaming.

---

## Market Opportunity

| Level | Size | Notes |
|-------|------|-------|
| TAM | $2.5-3B | TTRPG + Kids Apps + AI Storytelling |
| SAM | $50-100M | Family RPG + AI-assisted gaming |
| SOM Year 3 | $500K-1M | 4,000-8,000 paying subscribers |
| Your Target | ~$86K/year | 720 subscribers at $10/mo |

**Nordic Angle:** Denmark alone (~650K households with kids) could nearly hit target if you capture 1% with 10% conversion.

---

## Competitive Landscape

### Direct Competitors
| Competitor | Threat | Gap |
|------------|--------|-----|
| AI Dungeon | Medium | Not kid-safe, not family-focused |
| Friends & Fables | Medium-High | Adult-focused, no kids mode |
| AI Game Master | Medium | Solo only, no family |
| Gamestories.ai | High | Same age group, but not RPG |

### Your Unique Position
No one owns: **Kids + Family + AI + Screen-Light + Physical Dice + Nordic Languages**

### Emerging Threat
**Giant** raised $8M for AI kids storytelling—watch closely but differentiate via D&D/RPG mechanics.

---

## Differentiation Strategy

### What Makes You Different

| Feature | Competitors | You |
|---------|-------------|-----|
| Kid-Safe Content | No | Yes |
| Family Multiplayer (One Device) | No | Yes |
| Physical Dice Integration | No | Yes |
| Danish/Nordic TTS | No | Yes |
| Screen-Light Design | No | Yes |
| Parent as Co-Pilot (Not Replaced) | No | Yes |

### Positioning Statement

> "The only AI dungeon master built for families, where parents and kids play TOGETHER using physical dice, with screen-light design that encourages discussion and imagination over passive screen consumption."

---

## User Insights

### What Parents Actually Want
1. Zero-prep adventures
2. Confidence they're "doing it right"
3. Kids engaged (not bored)
4. Physical/tangible elements
5. Short sessions (30-60 min)
6. Replay and continuation

### Language That Resonates
- "Family adventure time"
- "Your kids will beg to play again"
- "No D&D experience needed"
- "Screen time that brings you together"

### Language to Avoid
- "AI Dungeon Master" (sounds like it replaces parent)
- "Educational" (turns kids off)
- "Parental controls" (sounds restrictive)

---

## Platform Decision

### Recommendation: PWA + Lovable + Supabase

| Component | Choice | Reason |
|-----------|--------|--------|
| Platform | Progressive Web App | Fastest MVP for PM learning to code |
| Build Tool | Lovable → Cursor | AI-assisted, outputs React/TypeScript |
| Backend | Supabase | All-in-one: Auth, DB, Edge Functions |
| LLM | Claude (Anthropic) | Story generation, content safety |
| TTS | ElevenLabs | Best Danish voice quality |
| Images | Google Imagen 4 | $0.02/image via Vertex AI |
| Hosting | Vercel/Netlify | Easy PWA deployment |

### Why PWA Works for "Screen-Light"

Your design philosophy turns traditional PWA weaknesses into non-issues:
- **Less "native" feel** → You WANT less screen engagement
- **Background audio limits** → Family is actively engaged, not multitasking
- **No app store presence** → Direct sharing works for family/friends niche

### Migration Path

PWA → Expo/Capacitor wrap → Native (if needed)

React/TypeScript code from Lovable can be wrapped later if app store presence becomes critical.

---

## Risk Assessment Summary

### Critical Risks (Must Address Before Launch)

| Risk | Severity | Mitigation |
|------|----------|------------|
| **COPPA Compliance** | CRITICAL | Family account model (parent owns, kids are players), legal review |
| **AI Content Safety** | CRITICAL | Guardrails, moderation API, red-team testing |
| **Danish TTS Quality** | HIGH | Test ElevenLabs with twins before building |

### Key Regulatory Finding: COPPA

**You're targeting children 7-13 in the US = full COPPA compliance required.**

- Fines up to $53,088 per violation
- Requires verifiable parental consent
- Recommend: Launch Denmark-first, US after legal review
- Solution: Parent-owned accounts, children as "players" not separate users

### Business Model Risk: TTS Costs

Heavy users (~8 sessions/month) could cost ~$43/month in TTS alone vs $10/month subscription.

**Mitigations:**
- Usage-based tiers
- Higher price point ($15-20/month)
- Text fallback option

### EU iOS Limitation (Denmark)

PWAs in EU (including Denmark) on iOS 17.4+ have degraded experience:
- No standalone mode
- No push notifications
- Browser chrome always visible

**Decision needed:** May require Capacitor wrapper for iOS sooner than planned

---

## Next Steps

### Discovery Complete - Moving to Build

1. ~~Phase 6: Platform Decision~~ → PWA + Lovable + Supabase
2. ~~Phase 7: Risk & Assumption Mapping~~ → 20 risks identified, COPPA critical
3. ~~Phase 8: Final Synthesis~~ → GO decision, 90-day roadmap

### This Week: Validation Sprint
- [ ] Test ElevenLabs Danish TTS with twins
- [ ] Paper prototype physical dice interaction
- [ ] Test Claude story generation for kid-safety
- [ ] Set up Supabase account

### 90-Day Roadmap
| Phase | Timing | Goal |
|-------|--------|------|
| Validate | Days 1-14 | Confirm TTS, AI, dice UX work |
| Build | Days 15-45 | Working adventure loop |
| Test | Days 46-60 | Family feedback, iterate |
| Launch | Days 61-90 | Soft launch Denmark |

### Success Targets
- Month 3: First paying stranger
- Month 6: 80 subscribers, ~$1,000 MRR
- Month 12: 400 subscribers, ~$5,000 MRR
- Month 18: 50,000 DKK/month target achieved

---

## Document Index

| File | Contents |
|------|----------|
| `01-problem-brief.md` | Problem definition, founder context, core philosophy |
| `02-problem-validation.md` | Pain evidence, frequency, payment validation, quotes |
| `03-market-sizing.md` | TAM/SAM/SOM, unit economics, comparables |
| `04-competitive-landscape.md` | 5-layer competitor analysis, gap analysis, positioning |
| `05-user-intelligence.md` | Personas, JTBD, voice of customer, language guidelines |
| `06-platform-decision.md` | PWA vs Native analysis, recommended stack, architecture |
| `07-risk-assumption-mapping.md` | Risk register, COPPA analysis, mitigation strategies |
| `08-final-synthesis.md` | GO decision, MVP spec, 90-day roadmap, success metrics |
| `09-mvp-prd.md` | MVP Product Requirements Document |
| `00-discovery-summary.md` | This file - executive summary |

---

*Research conducted April 2026 using web search, community analysis, and competitive intelligence.*
