# Family Quest MVP Design Specification

**Date:** 2026-04-04
**Status:** Draft
**Platform:** Next.js 16 / Vercel

---

## Overview

Family Quest is an AI-powered D&D companion app for families. A parent acts as the "Game Master" while AI generates the story, images, and narration. Kids make choices, roll dice, and experience collaborative storytelling.

**MVP Scope:** One adventure theme (Dungeons & Dragons), 1-4 players, core gameplay loop.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui v4 (base-nova style, heavily customized) |
| Backend | Supabase (auth, database, storage) |
| AI Story | Gemini 3 Flash (via Google AI Studio) |
| AI Images | Nano Banana 2 / Gemini 3.1 Flash Image (via Google AI Studio) |
| AI Voice | Gemini 2.5 Flash TTS (via Google AI Studio) |
| Platform | PWA (Progressive Web App) |

---

## Design System

### Color Palette (Dark Mode Default)

System preference is respected, defaulting to dark mode.

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep midnight | `#0a0e14` | App background |
| Surface | Slate blue | `#101820` | Cards, modals |
| Elevated | Light slate | `#1a2530` | Hover states, raised elements |
| Primary | Warm gold | `#f0a500` | CTAs, highlights, treasure |
| Secondary | Steel blue | `#3a8fb7` | Magic effects, links, info |
| Text | Cream white | `#faf8f5` | Body text (easy on eyes) |
| Text Muted | Soft gray | `#a0a8b0` | Secondary text |
| Success | Emerald | `#10b981` | Positive outcomes |
| Warning | Amber | `#f59e0b` | Caution states |
| Error | Rose | `#ef4444` | Failures, danger |

### Light Mode (Optional)

| Role | Color | Hex |
|------|-------|-----|
| Background | Warm cream | `#faf8f5` |
| Surface | Pure white | `#ffffff` |
| Text | Deep charcoal | `#1a1a1a` |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Georgia or Playfair Display | 600-700 | 24-32px |
| Body | System UI / Inter | 400 | 14-16px |
| Captions | System UI | 400 | 12px |
| Buttons | System UI | 500 | 14px |

Serif headings create fantasy atmosphere without sacrificing readability.

### Visual Differentiators

To avoid generic "AI slop" appearance:

1. **Depth & Texture** — Subtle gradients, layered shadows, parchment-like textures on cards
2. **Serif Typography** — Fantasy headers that feel storybook-appropriate
3. **Ornate Borders** — Decorative corner elements on key cards (character sheets, scene images)
4. **Magical Motion** — Subtle particle effects, glowing highlights on interactive elements

---

## Data Model

```
Family Account (Parent)
├── email, password
├── subscription status
├── settings (adventure style, difficulty, dice preference, language)
│
└── Players (1-4, persist forever)
    ├── display name ("Luna", "Max")
    ├── age (for AI calibration)
    ├── avatar color preference
    │
    └── Characters (per adventure)
        ├── character name ("Shadowblade Luna")
        ├── class (Warrior, Wizard, Rogue, Ranger)
        ├── gender (for avatar)
        ├── stats (derived from class)
        └── adventure state (items, progress, story flags)
```

**Key distinction:** Players are your kids (created once). Characters are who they play as in each adventure (created per campaign).

---

## Settings

### Adventure Style (Affects images AND writing tone)

| Style | Ages | Image Aesthetic | Narrative Tone |
|-------|------|-----------------|----------------|
| **Whimsical** | 4-7 | Bright colors, rounded shapes, storybook | Gentle, no scary moments, problems solved with kindness |
| **Realistic** (default) | 7-12 | Detailed fantasy art, dynamic action | Exciting adventures, mild tension, heroes always prevail |
| **Dark** | 13+ | Moody lighting, atmospheric | Complex themes, real consequences, genuinely challenging |

### Difficulty Level

| Level | Dice Threshold | Setbacks | AI Hints | Pace |
|-------|---------------|----------|----------|------|
| **Easy** | Roll 2+ on d6 | Minor inconveniences | Clear suggestions | Quick wins |
| **Medium** (default) | Roll 3-4+ on d6 | Meaningful but recoverable | Options presented equally | Balanced |
| **Hard** | Roll 5+ on d6 | Real consequences | Minimal guidance | Earned victories |

### Dice Preference

Set once in settings, used throughout adventure:

- **Physical dice** — User rolls a physical d6, enters the result in the app
- **Digital dice** — App animates dice roll with tap-to-roll interaction

> **MVP scope:** d6 only. Support for other die types (d4, d8, d10, d12, d20) is post-MVP.

### Language

> **Post-MVP.** The language toggle UI is present but non-functional in MVP. Full i18n (English/Danish) will be implemented after core gameplay is validated.

- Default: English (🇬🇧 flag displayed)
- Alternative: Danish (🇩🇰 flag)
- Changed by tapping flag icon (always visible in corner)

---

## Character System

### Stats (4 total)

| Stat | Emoji | Description |
|------|-------|-------------|
| **Strength** | 💪 | Physical power, lifting, breaking, melee combat |
| **Magic** | ✨ | Spells, arcane knowledge, magical effects |
| **Agility** | 🏃 | Speed, stealth, dodging, acrobatics |
| **Heart** | ❤️ | Persuasion, courage, kindness, helping others |

Heart stat encourages non-combat solutions appropriate for family play.

### Classes (4 total)

| Class | Emoji | High Stats | Low Stats | Good At | Not Great At |
|-------|-------|------------|-----------|---------|--------------|
| **Warrior** | ⚔️ | Strength, Heart | Magic | Fighting, protecting friends | Sneaking, casting spells |
| **Wizard** | 🧙 | Magic, Agility | Strength | Casting spells, solving puzzles | Heavy lifting, direct combat |
| **Rogue** | 🗡️ | Agility, Magic | Heart | Sneaking, finding treasure | Talking their way out, brute force |
| **Ranger** | 🏹 | Agility, Heart | Magic | Tracking, archery, nature | Magic spells, heavy combat |

### Stat Distribution

Scale: 1-5 per stat (total of 12 points per class)

| Class | STR | MAG | AGI | HRT |
|-------|-----|-----|-----|-----|
| Warrior | 5 | 1 | 2 | 4 |
| Wizard | 1 | 5 | 4 | 2 |
| Rogue | 2 | 3 | 5 | 2 |
| Ranger | 2 | 2 | 4 | 4 |

### Avatars

- Illustrated character art (not icons)
- Gender options per class
- Generated with Nano Banana 2 (Gemini 3.1 Flash Image)
- Style-matched (Whimsical/Realistic/Dark versions)
- Placeholder boxes during development

**Avatar count needed:** 4 classes × 2 genders × 3 styles = 24 base avatars

---

## User Flow

### First-Time Setup (4 steps)

```
1. Welcome
   └── "Begin Your Journey" button
   └── Anonymous auth created silently in background

2. Add Players
   └── Name + age for each kid
   └── 1-4 players
   └── Persist forever (reusable across adventures)

3. Settings
   └── Dice preference (physical / digital)
   └── Adventure Style (Whimsical / Realistic / Dark)
   └── Difficulty (Easy / Medium / Hard)

4. Create Characters
   └── Each player picks a class
   └── Avatar selection (matches chosen style)
   └── Character naming

→ Play begins (D&D adventure auto-selected)
```

> **Removed for MVP:** Account creation screen (anonymous auth covers persistence) and Adventure Selection screen (only one adventure exists).

### Returning User Flow

```
1. Welcome back
   └── Show existing players

2. Select Players (for this session)
   └── Checkboxes for who's playing
   └── Option to add new player
   └── Option to manage (rename/remove)

3. Continue Adventure OR Start New
   └── If continuing: straight to play
   └── If new: Settings → Characters → Play
```

---

## Adventure Play (Core Loop)

### Four States

```
┌─────────────────────────────────────────────────────────────┐
│                     1. SCENE DISPLAY                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              [AI-Generated Scene Image]              │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  "You enter a dimly lit cavern. Water drips from          │
│   stalactites above. In the distance, you hear a          │
│   low growl..."                                            │
│                                                             │
│  🎧 [Play Narration]                                       │
│                                                             │
│  Active Player: Luna ⚔️                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    2. CHOOSE ACTION                         │
│                                                             │
│  What does Luna do?                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💪 "I'll light a torch and investigate the growl"  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏃 "I sneak along the shadows to get closer"        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ❤️ "I call out friendly greetings to whoever's     │   │
│  │    making that noise"                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  (3 AI-generated options, no free text for MVP)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      3. DICE ROLL                           │
│                                                             │
│  Luna chose: "Sneak along the shadows"                     │
│  This requires: 🏃 Agility                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │                    [d6 Image]                        │   │
│  │                                                       │   │
│  │              Roll and see what happens!              │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Physical: "Roll your d6 and enter the result"            │
│  Digital: [Tap to Roll] button                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       4. OUTCOME                            │
│                                                             │
│  🎉 SUCCESS! Luna rolled a 5                               │
│                                                             │
│  "Moving silently as a shadow, Luna creeps along the      │
│   cavern wall. The growling creature doesn't notice        │
│   as you slip past..."                                      │
│                                                             │
│  [Continue Adventure →]                                     │
└─────────────────────────────────────────────────────────────┘
```

### Player Rotation

**Hybrid approach:** AI picks narratively appropriate player, but enforces max 2-turn wait.

- AI chooses who acts based on story context
- If a player hasn't acted in 2 turns, they're guaranteed next
- Turn indicator shows whose turn it is
- Keeps all players engaged without rigid round-robin

### Game Mechanics: Three-Factor Success System

Success is determined by three hidden factors. Players see only the options and their dice roll — they learn through play what works.

**Factor 1: Scene Fit (AI-assigned, hidden from players)**

| Rating | Value | Meaning |
|--------|-------|---------|
| Good | +2 | Smart choice for this situation |
| Okay | +1 | Reasonable approach |
| Risky | +0 | Possible but not ideal |

The AI evaluates each option based on the narrative situation, independent of character stats. Fighting a sleeping dragon is "risky" even for a warrior. Sneaking past is "good" regardless of who attempts it.

**Factor 2: Character Stat (1-5)**

The stat value for the relevant ability (Strength, Magic, Agility, or Heart).

**Factor 3: Dice Roll (1-6)**

Physical or digital d6 roll.

**Success Calculation**

```
Combined Score = Scene Fit + Stat + Dice Roll
```

| Difficulty | Success | Partial Success | Failure |
|------------|---------|-----------------|---------|
| Easy | 8+ | 6-7 | ≤5 |
| Medium | 9+ | 7-8 | ≤6 |
| Hard | 10+ | 8-9 | ≤7 |

**Example:**

Scene: A dragon sleeps on treasure.
Option chosen: "Sneak past while it sleeps" (Agility)
- Scene Fit: Good (+2) — exploits the situation
- Character Stat: Rogue with Agility 5 (+5)
- Dice Roll: Player rolls 3 (+3)
- Combined: 2 + 5 + 3 = 10 → Success on Medium!

Same scene, same option, different character:
- Scene Fit: Good (+2)
- Character Stat: Warrior with Agility 2 (+2)
- Dice Roll: Player rolls 3 (+3)
- Combined: 2 + 2 + 3 = 7 → Partial Success on Medium

**Outcome Types**

| Result | Narrative Treatment |
|--------|---------------------|
| **Success** | Action works as intended, story advances |
| **Partial Success** | Action works but with a complication or cost |
| **Failure** | Action doesn't work, but something new is revealed (plot twist, not punishment) |

**Design Intent:**

- No visual difficulty indicators — kids discuss and strategize
- Smart choices matter as much as stats
- Players learn their character's strengths through experience
- Failure is never punishing, always moves the story forward

### Content Loading Strategy

To minimize dead time where users see/hear nothing:

```
1. AI generates story text (fastest)
   └── Display text immediately

2. TTS generates audio (medium speed)
   └── Play narration when ready
   └── User can read ahead while waiting

3. Image generates (slowest, 5-15 seconds)
   └── Show shimmer placeholder
   └── Fade in when ready
   └── User already engaged with text/audio
```

Outcome text is generated on-demand after the dice roll (not pre-generated).

### Rate Limit Mitigation (Image & TTS: 1 RPM each)

Image and TTS models have strict 1 RPM rate limits. Strategy:

1. **Cache aggressively** — Store generated images/audio in memory (and optionally Supabase Storage) keyed by scene. Never regenerate for the same scene on retry or page reload.
2. **Image: generate once per scene, not per turn** — A scene image is generated when the scene loads. Subsequent turns within the same scene reuse the image.
3. **TTS: on-demand only** — Narration audio is generated only when the user taps the play button, not automatically. This avoids wasting the 1 RPM limit.
4. **Graceful degradation** — If rate-limited, show a friendly placeholder ("Image is taking a moment...") with a retry button. Never block gameplay waiting for an image.
5. **Text-first design** — Story text loads instantly (Gemini 3 Flash, 19 RPM). Players can always read and act while image/audio load in the background.

### Game State Persistence

Adventure state is persisted to:
1. **Zustand with localStorage** — Immediate persistence on every state change. Survives page refresh and browser close.
2. **Supabase `adventures.state` column** — Synced periodically (on scene transitions and when saving/quitting). Enables cross-device resume.

Persisted state includes: current scene narration, story history, turn history, current player index, and any items/flags.

---

## Screens Summary

### Priority Screens (MVP)

| Screen | Purpose |
|--------|---------|
| Welcome | Get started |
| Players | Add/select players |
| Settings | Dice, adventure style, difficulty |
| Character Selection | Class + avatar per player |
| Adventure Play | Core gameplay loop |
| Pause Overlay | Save & quit, back to menu |

> **Removed for MVP:** Adventure Selection (only one adventure exists — auto-select D&D). Account creation (use anonymous Supabase auth, optional upgrade later).

### Post-MVP

- Account creation / email signup (upgrade anonymous auth)
- Adventure selection screen (when multiple adventures exist)
- Character sheet / inventory
- Adventure history / journal
- Save slots
- Profile customization
- Full i18n (English/Danish)

---

## AI Prompting Strategy

### Story Generation

The AI receives:
- Current adventure style setting
- Difficulty level
- Active players and their characters
- Story history / state
- Current scene context

**Style prompt modifiers:**

| Style | Prompt Additions |
|-------|------------------|
| Whimsical | "Keep the tone gentle and child-friendly. No scary moments. Problems are solved with creativity and kindness." |
| Realistic | "Create exciting adventure with mild tension. Heroes face real challenges but always prevail. Age-appropriate for 7-12." |
| Dark | "Include complex themes and real consequences. Atmosphere can be moody. Appropriate for teens." |

### Image Generation

Prompt structure:
```
[Style prefix] + [Scene description] + [Style suffix]

Whimsical: "Bright, colorful storybook illustration style. Friendly, rounded shapes. Warm lighting."
Realistic: "Detailed fantasy art, dynamic composition. Exciting but not scary. Think Pixar/DreamWorks."
Dark: "Atmospheric fantasy art. Moody lighting, rich shadows. Mature aesthetic."
```

### Action Generation

AI generates 3 action options with hidden scene fit ratings:

```json
{
  "options": [
    {
      "action_text": "I'll sneak past while it sleeps",
      "stat_used": "agility",
      "scene_fit": "good",
      "scene_fit_reason": "Exploits the dragon sleeping, avoids unnecessary risk"
    },
    {
      "action_text": "I'll fight the dragon!",
      "stat_used": "strength",
      "scene_fit": "risky",
      "scene_fit_reason": "Dragon is powerful, fighting is dangerous when stealth is possible"
    },
    {
      "action_text": "I'll try to befriend the dragon",
      "stat_used": "heart",
      "scene_fit": "okay",
      "scene_fit_reason": "Creative approach, uncertain outcome but not foolish"
    }
  ]
}
```

**Generation rules:**
- Use different stats when possible
- At least one option should be "good" scene fit
- At least one non-combat option
- Scene fit based on situation, not character
- Options clear enough for kids to understand

### Outcome Generation (On-Demand)

After dice roll, generate outcome based on result:

```
Input:
- Action chosen: [text]
- Scene fit: [good/okay/risky]
- Stat: [name] (value: [X])
- Dice: [Y]
- Result: [success/partial/failure]

Generate 2-3 sentence outcome:
- SUCCESS: Action works, advance story
- PARTIAL: Works with complication or cost
- FAILURE: Doesn't work, but reveal something new (plot twist, not punishment)
```

---

## Error States

| Scenario | Handling |
|----------|----------|
| AI text generation fails | Show friendly message, offer retry |
| Image rate-limited (1 RPM) | Show themed placeholder, queue retry. Never block gameplay. |
| TTS rate-limited (1 RPM) | Show "Audio unavailable" on play button, offer retry later |
| Network lost mid-adventure | Auto-save to localStorage, offer continue later |
| Image fails to load | Show placeholder with retry button |
| Invalid dice entry | Show inline error "Please enter 1-6", keep input focused |
| Page refresh mid-adventure | Restore from localStorage (Zustand persist) |

---

## Accessibility Considerations

- High contrast text (cream on dark blue)
- Clear touch targets (44px minimum)
- Audio narration option for story text
- Simple language in UI
- Reduced motion option for animations

---

## Resolved Decisions

1. **TTS Provider** — Gemini 2.5 Flash TTS (via Google AI Studio, 1 RPM rate limit)
2. **AI Models** — Gemini 3 Flash for story/action/outcome text generation, Nano Banana 2 (Gemini 3.1 Flash Image) for scene images, Gemini 2.5 Flash TTS for narration. Image and TTS models have tight rate limits (1 RPM) — avoid unnecessary regeneration. Model names configurable via environment variables for easy upgrades.
3. **Offline Support** — Post-MVP. Core value requires AI generation which needs network. Would add significant complexity (service workers, IndexedDB, sync logic) without enabling the main feature.
4. **Parent Dashboard (MVP)** — Minimal scope:
   - Player management (add/edit/remove)
   - Settings control (adventure style, difficulty, dice, language)
   - Last played info
   - Post-MVP: Story recaps, play time stats, content filtering
5. **Monetization** — Free for MVP. Revisit after validating product-market fit.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Session completion | >70% of started adventures reach natural pause point |
| Return rate | >50% of users return within 7 days |
| Multi-player sessions | >60% of sessions have 2+ players |
| Parent satisfaction | NPS >50 |

---

## Appendix: Visual Mockups

During brainstorming, the following mockups were created in the visual companion:

- `visual-direction.html` — Design differentiators
- `adventure-play-states.html` — Core gameplay loop
- `onboarding-screens.html` — Flow optimization
- `players-and-styles.html` — Data model visualization
- `styles-and-difficulty.html` — Style/difficulty options
- `revised-flow.html` — Final onboarding flow
- `character-selection-detailed.html` — Stats and class system
- `dark-mode-palettes.html` — Color exploration
- `dark-mode-gold-variants.html` — Final palette options

Located in: `.superpowers/brainstorm/98085-1775291056/`
