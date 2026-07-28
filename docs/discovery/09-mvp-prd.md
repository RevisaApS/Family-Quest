# MVP PRD: Family Quest — AI Family D&D Companion

**Date:** April 2026
**Status:** Ready for Validation Sprint
**Version:** 1.0

---

## 1. Executive Summary

| Element | Detail |
|---------|--------|
| **Elevator Pitch** | AI-powered D&D companion that lets parents run zero-prep adventures with kids 7-13, with narration and images that keep families talking to each other instead of staring at screens |
| **Problem Statement** | Parents want to facilitate D&D-style adventures for young children but lack DM skills, prep time, and tools that support family interaction over passive screen consumption |
| **Target User** | "Adventure Parent Alex": Geeky parent (30-45) with kids 7-13, played/wanted to play D&D, high tech comfort, $10-15/month price tolerance |
| **Proposed Solution** | PWA with AI story generation, Danish/English TTS narration, and scene images—conversation-first design with ongoing campaign support |
| **MVP Success Metric** | 5+ non-friend paying subscribers by Month 3; kids ask to play again unprompted |

---

## 2. Key Features

### Feature 1: AI Adventure Engine with Campaign Continuity

| Aspect | Detail |
|--------|--------|
| **User Story** | As a parent, I want to start or continue an adventure with zero prep so we can build an ongoing story over multiple sessions |
| **Acceptance Criteria** | • Select from 2-3 adventure templates OR continue existing campaign<br>• AI generates age-appropriate story scenes<br>• Story state saves automatically<br>• Content moderation prevents inappropriate output |
| **Priority** | P0 (Must Have) |
| **Dependencies** | LLM API (Gemini or Claude), content safety guardrails, Supabase for state persistence |
| **Risks** | AI loses story coherence across sessions → Mitigate with structured story state logging |

### Feature 2: Conversation-First Narration

| Aspect | Detail |
|--------|--------|
| **User Story** | As a family, we want the app to narrate the story aloud and show images so we can look at each other and discuss, not stare at screens |
| **Acceptance Criteria** | • TTS narrates each scene in Danish or English<br>• One scene image per major story beat<br>• Screen pauses after narration to prompt discussion<br>• "What do you do?" prompt appears after each scene |
| **Priority** | P0 (Must Have) |
| **Dependencies** | TTS (ElevenLabs or Gemini TTS), Image generation (Imagen 4 or Gemini Image) |
| **Risks** | Danish TTS sounds robotic → Validate with twins in Week 1 before building |

### Feature 3: Flexible Dice Rolling

| Aspect | Detail |
|--------|--------|
| **User Story** | As a family, we want the option to use our physical dice or roll in-app, depending on what we have available |
| **Acceptance Criteria** | • "Roll!" prompt when dice needed<br>• Option A: Enter physical dice result via number buttons<br>• Option B: Tap to roll in-app with animation<br>• AI narrative responds to dice outcomes |
| **Priority** | P1 (Should Have) |
| **Dependencies** | None |
| **Risks** | Low—both options are straightforward |

---

## 3. Requirements Overview

### Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Authentication | Parent email/password via Supabase Auth |
| Family accounts | Parent creates account; adds child display names (no PII) |
| Adventure selection | Start new (2-3 templates) OR continue existing campaign |
| Character creation | Name, class (Warrior/Wizard/Rogue/Ranger), simple traits; persists across sessions |
| Story loop | Scene → Image → TTS → "What do you do?" → Action input → Dice (if needed) → AI outcome → Repeat |
| Save/Continue | Auto-save story state; resume from any point |

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Load time | < 3 seconds to adventure start |
| TTS latency | < 5 seconds from scene generation to audio start |
| Availability | 99% uptime |
| Data privacy | GDPR compliant; no child PII stored |

### UX Requirements

| Requirement | Detail |
|-------------|--------|
| Mobile-first | Works on phone propped on table |
| Large touch targets | Buttons 60px+ for kid fingers |
| Minimal text input | Parent types actions; buttons for everything else |
| Encouraging tone | "You did it!" never "You failed" or "Game over" |
| Flexible session length | Natural pause points; no forced ending |

---

## 4. Validation Plan

### Core Hypothesis

Parents will pay $12-15/month for an AI tool that lets them run ongoing D&D campaigns with their kids with zero prep, if it keeps kids engaged and families interacting.

### Key Assumptions to Test

| Assumption | Test | Pass Criteria |
|------------|------|---------------|
| Danish TTS sounds natural | Play samples to twins (test both ElevenLabs and Gemini TTS) | Kids stay engaged, don't complain about voice |
| AI content is kid-safe | Generate 20 adventure scenes, review | 0 inappropriate outputs |
| Story continuity works across sessions | Run 3-session campaign | Story remains coherent; kids remember what happened |
| Conversation-first design works | Observe family during play | Family discusses between prompts; not glued to screen |

### Next Step

**Week 1-2 Validation Sprint:** Test TTS options, AI generation, and story continuity with twins before writing code.

---

## 5. Critical Questions Checklist

- [ ] Does Danish TTS pass the "twins test"? (Compare ElevenLabs vs Gemini TTS)
- [ ] Can AI reliably generate kid-safe content with guardrails?
- [ ] Can AI maintain story coherence across multiple sessions?
- [ ] Will parents actually pay $12-15/month after free trial?
- [ ] Does EU iOS PWA limitation require Capacitor wrap for Denmark launch?

---

## 6. Tech Stack

### Development/Validation Phase (Free Tier)

| Component | Choice | Notes |
|-----------|--------|-------|
| Frontend | React/TypeScript via Lovable | |
| Backend | Supabase | Auth, DB, Edge Functions |
| LLM | Gemini 2.5 Flash (Google AI Studio) | 33 RPM, 132 RPD—sufficient for testing |
| TTS | Gemini 2.5 Flash TTS | 1 RPM, 26 RPD—test Danish quality |
| Images | Nano Banana 2 (Gemini 3.1 Flash Image) | 1 RPM, 24 RPD—sufficient for testing |
| Hosting | Vercel | |

### Production Phase (Paid APIs)

| Component | Choice | Notes |
|-----------|--------|-------|
| LLM | Claude API (primary), Gemini (fallback) | Better story quality, content safety |
| TTS | ElevenLabs | Best Danish quality (validate first) |
| Images | Google Imagen 4 | $0.02/image |
| Payments | Stripe | |

---

## 7. Out of Scope (MVP)

| Feature | Reason |
|---------|--------|
| Character progression/leveling | Validate core story loop first |
| Inventory management | Keep mechanics narrative-first |
| Voice input | Buttons/text simpler |
| Languages beyond Danish/English | Validate core markets first |
| Offline mode | Requires caching infrastructure |
| US launch | COPPA compliance deferred |

---

## 8. Success Targets

| Milestone | Timing | Metric |
|-----------|--------|--------|
| Playable prototype | Week 6 | Complete adventure end-to-end |
| Kids ask to play again | Week 8 | Unprompted replay requests |
| First paying stranger | Month 3 | 5+ non-friend subscribers |
| Product-market fit signal | Month 6 | 80 subscribers, <10% churn |

---

## 9. Core User Flow

```
1. ONBOARDING (First time only)
   Parent creates account (email + password)
   ↓
   Parent adds child profile(s) (display names only, no PII)
   ↓
   Brief tutorial: "Here's how family adventure time works"

2. START ADVENTURE
   Parent selects: New Adventure OR Continue Campaign
   ↓
   [If new] Select adventure template + quick character setup
   ↓
   "Gather around! Adventure begins..."

3. PLAY LOOP (Repeat)
   ┌──────────────────────────────────────────────────────┐
   │  AI generates scene description                      │
   │  ↓                                                   │
   │  Image appears on screen                             │
   │  ↓                                                   │
   │  TTS narrates scene                                  │
   │  ↓                                                   │
   │  Screen pauses: "What do you do?"                    │
   │  ↓                                                   │
   │  Family discusses (conversation-first moment)        │
   │  ↓                                                   │
   │  Parent inputs action                                │
   │  ↓                                                   │
   │  [If dice needed] "Roll!" → physical or in-app      │
   │  ↓                                                   │
   │  AI generates outcome, loop continues                │
   └──────────────────────────────────────────────────────┘

4. PAUSE / END SESSION
   "Save and continue later?" or "Keep playing?"
   ↓
   Story state auto-saved
   ↓
   "See you next time, adventurers!"
```

---

## 10. Data Model (Supabase)

```sql
-- Parent accounts (GDPR/COPPA compliant - no child PII)
families (
  id uuid primary key,
  parent_email text,
  parent_name text,
  created_at timestamp,
  subscription_status text,
  preferred_language text  -- 'da' or 'en'
)

-- Child profiles (minimal, no PII)
players (
  id uuid primary key,
  family_id uuid references families,
  display_name text,  -- "Dragon Slayer Danny" not real name
  character_class text,
  created_at timestamp
)

-- Campaign state (persistent stories)
campaigns (
  id uuid primary key,
  family_id uuid references families,
  template_id text,
  title text,
  story_state jsonb,  -- Current narrative context for AI
  created_at timestamp,
  last_played_at timestamp
)

-- Session log (for replay/summary)
sessions (
  id uuid primary key,
  campaign_id uuid references campaigns,
  started_at timestamp,
  ended_at timestamp,
  story_log jsonb  -- Full narrative for this session
)

-- Pre-built templates
adventure_templates (
  id text primary key,
  title text,
  description text,
  opening_prompt text,
  suggested_age text
)
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial MVP PRD based on discovery findings |

---

*Based on discovery research in `discovery/01-08`*
*Next phase: Validation Sprint (Week 1-2)*
