# Design Brief: Family Quest — AI Family D&D Companion

**Purpose:** Input for Google Stitch design ideation
**Platform:** Mobile-first PWA (responsive web app)

---

## Product Overview

Family Quest is an AI-powered D&D companion app for parents playing tabletop adventures with kids aged 7-13. The app narrates stories, shows scene images, and prompts for dice rolls—designed so families talk to each other, not stare at screens.

**Core concept:** Phone sits on the table. Family gathers around. Listen to the story, look at the image, then put the phone down and discuss what to do next.

---

## Target Users

**Primary:** Parents (30-45) running adventures for their kids
**Secondary:** Kids (7-13) as players

**Key insight:** Parents fear "doing it wrong." The app should feel encouraging, magical, and impossible to mess up.

---

## Design Principles

### 1. Conversation-First
- Screen is a facilitator, not the focus
- After narration plays, screen should invite putting it down
- Large "discussion pause" moments built in

### 2. Kid-Friendly, Not Childish
- Magical and adventurous aesthetic
- Appeals to both kids AND parents
- Avoid overly cartoonish or "edu-tainment" feel
- Think: Pixar, not PBS Kids

### 3. Cozy Fantasy
- Warm colors (amber, deep purple, forest green)
- Illustrated storybook feel
- Torchlit tavern vibes, not sterile tech

### 4. Zero Friction
- Minimum taps to start playing
- Large touch targets (60px+) for kid fingers
- No complex menus or settings during play

### 5. Encouraging Tone
- Celebrate successes enthusiastically
- Never say "failed" or "game over"
- Setbacks are "plot twists" not failures

---

## Screens to Design

### Screen 1: Welcome / Login
**Purpose:** First impression + authentication
**Elements:**
- App logo and tagline
- Warm, inviting illustration (family around table with dice)
- "Start Your Adventure" button
- Simple email/password login
- "New here? Create account"

**Mood:** Magical invitation, like opening a storybook

---

### Screen 2: Family Dashboard
**Purpose:** Home base after login
**Elements:**
- Greeting: "Welcome back, [Parent Name]!"
- Player avatars (the kids' characters)
- "Continue Adventure" card (if campaign exists)
- "New Adventure" button
- Campaign history/past adventures
- Settings icon (subtle)

**Mood:** Cozy tavern notice board

---

### Screen 3: Adventure Selection
**Purpose:** Choose which adventure template to play
**Elements:**
- 2-3 adventure cards with:
  - Illustration
  - Title ("The Dragon's Riddle")
  - Short description (1-2 lines)
  - Suggested age/difficulty indicator
- "Continue [Campaign Name]" option if applicable
- Back button

**Mood:** Choosing a quest from the guild board

---

### Screen 4: Character Selection
**Purpose:** Quick character setup per child
**Elements:**
- For each child player:
  - Character class cards (Warrior, Wizard, Rogue, Ranger)
  - Each card shows: icon, class name, simple trait
  - Character name input (pre-filled with fun suggestions)
- "Begin Adventure" button
- Playful illustrations for each class

**Mood:** Choosing your hero at character creation

**Notes:**
- Should feel fast (under 30 seconds per kid)
- Large, tappable class cards
- Fun default names like "Brave Lily" or "Shadow Max"

---

### Screen 5: Adventure Play (Core Experience)
**Purpose:** The main gameplay loop
**Layout:** Full-screen immersive

**State 5A: Scene Display**
- Large scene illustration (top 60% of screen)
- Scene text below image (for following along)
- Audio playing indicator (subtle waveform or speaker icon)
- Pause/replay audio button

**State 5B: Discussion Prompt**
- Screen dims slightly or illustration softens
- Large text: "What do you do?"
- Subtle pulsing or gentle animation
- Text input field appears
- Quick action suggestion chips (optional): "Fight", "Talk", "Explore", "Run"
- "We decided!" submit button

**State 5C: Dice Roll**
- Dramatic prompt: "Roll your dice!"
- Dice type indicator (d20, d6, etc.) with illustration
- Two options side by side:
  - "Enter result" → number pad (1-20)
  - "Roll in app" → animated dice roll
- Large, kid-friendly buttons

**State 5D: Outcome**
- Result celebration or dramatic tension
- Success: Sparkles, fanfare feeling
- Challenge: Dramatic but not discouraging
- Flows back to next scene

**Mood:** Immersive storybook that comes alive

---

### Screen 6: Pause Menu
**Purpose:** Mid-session options
**Triggered by:** Menu icon or "Pause adventure"
**Elements:**
- "Resume Adventure"
- "Save & Quit" (continue later)
- "Adjust Volume"
- "End Adventure" (with confirmation)
- Current adventure summary/progress

**Mood:** Quick pit stop, not disruptive

---

### Screen 7: Adventure Summary
**Purpose:** End-of-session celebration
**Elements:**
- "Adventure Complete!" or "To Be Continued..."
- Recap highlights (key moments, funny decisions)
- Character achievements or moments
- "Play Again" button
- "Return Home" button
- Share/save memory option (optional)

**Mood:** Closing the storybook, satisfied

---

### Screen 8: Settings
**Purpose:** Account and preferences
**Elements:**
- Language toggle (Danish / English)
- Manage players (add/edit/remove)
- Audio settings
- Account details
- Subscription status
- Privacy & Terms links

**Mood:** Simple, minimal, out of the way

---

## Key Interactions

### Audio Narration Flow
1. Scene loads → image appears first
2. Short pause (let family look at image)
3. TTS narration begins automatically
4. During narration: screen shows text, subtle audio indicator
5. After narration: transition to "What do you do?" state
6. Screen should feel like it's "waiting" for the family

### Dice Roll Interaction
1. Prompt appears dramatically
2. Clear choice: physical or digital dice
3. If physical: large number buttons in a grid
4. If digital: satisfying roll animation with sound
5. Result announced with appropriate drama

### Discussion Moment
- This is THE key moment
- Screen should visually "step back"
- Encourage looking up from device
- Perhaps: dim screen edges, gentle pulse, or "thinking" animation
- No rush or timer—family controls pace

---

## Visual Style Guide

### Color Palette
| Color | Use | Hex |
|-------|-----|-----|
| Deep Purple | Primary, headers | #4A3B6B |
| Warm Amber | Accents, highlights | #F4A836 |
| Forest Green | Secondary accent | #2D5A4A |
| Parchment Cream | Backgrounds | #F5F0E6 |
| Charcoal | Text | #2C2C2C |

### Typography
- **Headers:** Decorative but readable (fantasy serif)
- **Body:** Clean, readable sans-serif
- **Large sizes:** Minimum 18px for readability in dim rooms

### Illustration Style
- Hand-illustrated, storybook feel
- Warm, painterly textures
- NOT 3D rendered or photorealistic
- NOT anime or overly cartoonish
- Inspiration: classic fantasy book illustrations, Dixit cards

### Icons
- Simple, rounded, friendly
- Consistent stroke weight
- Easily recognizable at small sizes

---

## Component Library Needs

### Buttons
- Primary: Large, rounded, warm color (amber on purple)
- Secondary: Outlined, subtle
- Dice input: Grid of large number buttons
- Icon buttons: Circular, 48px minimum

### Cards
- Adventure cards: Image + text + subtle border
- Character class cards: Icon-forward, tappable
- Campaign summary cards: Progress indicator

### Inputs
- Text field: Large, simple, minimal
- Number pad: Big buttons, clear feedback

### Feedback
- Success: Sparkle/glow animation
- Loading: Magical shimmer, not spinner
- Transition: Page turn or fade, not slide

---

## Responsive Considerations

**Primary:** Mobile (portrait, phone on table)
**Secondary:** Tablet (landscape, propped up)

- Design mobile-first
- Tablet can show more scene detail
- Core interaction patterns same across devices
- Touch targets must work for kids

---

## What NOT to Design

- Complex settings or configurations
- Detailed character sheets
- Inventory management screens
- Battle maps or tactical views
- Social/multiplayer features
- Onboarding carousels (keep it simple)

---

## Summary for Stitch Prompt

> Design a mobile-first fantasy adventure app for families. Parents run D&D-style adventures for kids 7-13. The app shows illustrated scenes, narrates the story aloud, then prompts "What do you do?" for family discussion. Key screens: Welcome, Dashboard, Adventure Select, Character Select, Adventure Play (with scene/dice/discussion states), and Summary. Style: warm storybook fantasy (deep purple, amber, parchment), hand-illustrated feel, cozy not childish. Large touch targets, encouraging tone, conversation-first design where the screen facilitates but doesn't dominate.
