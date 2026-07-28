# Family Quest MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working MVP of Family Quest — an AI-powered D&D companion app for families with onboarding, character creation, and core gameplay loop.

**Architecture:** Next.js 16 App Router with React 19 Server Components where possible, client components for interactive elements. Supabase for auth and database. AI integration via Google AI Studio (Gemini 3 Flash for story text, Nano Banana 2 for images, Gemini 2.5 Flash TTS for narration). PWA for mobile installation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4 (CSS-based config, oklch colors), shadcn/ui v4 (base-nova style, @base-ui/react), Supabase, Google AI Studio (Gemini 3 Flash, Nano Banana 2, Gemini 2.5 Flash TTS), Zustand v5, Framer Motion, Vitest

**Spec Document:** `docs/superpowers/specs/2026-04-04-family-quest-mvp-design.md`

---

## File Structure

```
family-quest/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── page.tsx                   # Welcome screen
│   │   ├── globals.css                # Tailwind v4 CSS config + custom styles
│   │   ├── manifest.ts               # PWA manifest (Next.js 16 convention)
│   │   ├── players/
│   │   │   └── page.tsx               # Add/select players
│   │   ├── settings/
│   │   │   └── page.tsx               # Dice, style, difficulty
│   │   ├── characters/
│   │   │   └── page.tsx               # Character creation per player
│   │   └── play/
│   │       └── page.tsx               # Core game loop
│   ├── components/
│   │   ├── ui/                        # shadcn components (customized)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── page-container.tsx     # Consistent page wrapper
│   │   │   ├── header.tsx             # App header with language flag
│   │   │   └── loading-shimmer.tsx    # Loading placeholder
│   │   ├── onboarding/
│   │   │   ├── player-card.tsx        # Player display/edit card
│   │   │   ├── class-card.tsx         # Character class selection
│   │   │   ├── style-option.tsx       # Adventure style picker
│   │   │   └── difficulty-option.tsx  # Difficulty picker
│   │   └── game/
│   │       ├── scene-display.tsx      # Scene image + narration
│   │       ├── action-picker.tsx      # 3 action options
│   │       ├── dice-roller.tsx        # Physical/digital dice
│   │       ├── outcome-display.tsx    # Success/partial/fail result
│   │       └── player-turn.tsx        # Current player indicator
│   ├── lib/
│   │   ├── utils.ts                   # cn() utility (already exists)
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client
│   │   │   ├── auth.ts                # Anonymous auth helper
│   │   │   └── middleware.ts          # Auth middleware
│   │   ├── ai/
│   │   │   ├── gemini.ts              # Gemini API client
│   │   │   ├── story.ts               # Story/scene generation
│   │   │   ├── actions.ts             # Action option generation
│   │   │   ├── outcomes.ts            # Outcome generation
│   │   │   ├── images.ts              # Image generation
│   │   │   └── tts.ts                 # Text-to-speech
│   │   └── game/
│   │       ├── mechanics.ts           # Dice rolls, success calculation
│   │       ├── classes.ts             # Class definitions + stats
│   │       ├── state.ts               # Game state management
│   │       └── rotation.ts            # Player rotation logic
│   ├── hooks/
│   │   ├── use-game-state.ts          # Game state hook
│   │   ├── use-players.ts             # Player management
│   │   └── use-settings.ts            # Settings management
│   ├── types/
│   │   ├── database.ts                # Supabase generated types
│   │   ├── game.ts                    # Game-specific types
│   │   └── ai.ts                      # AI response types
│   └── stores/
│       └── game-store.ts              # Zustand store for game state
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema
├── tests/
│   ├── lib/
│   │   └── game/
│   │       ├── mechanics.test.ts
│   │       ├── classes.test.ts
│   │       └── rotation.test.ts
│   └── components/
│       └── game/
│           └── dice-roller.test.tsx
├── .env.local                         # Environment variables
├── next.config.ts                     # Next.js 16 config
├── vitest.config.ts                   # Test configuration
├── tsconfig.json
└── package.json
```

---

## Phase 1: Foundation

### Task 1: Project Setup

> **Status:** Mostly complete. Project scaffolded with Next.js 16, React 19, Tailwind v4, shadcn v4 (base-nova). Core deps installed (Supabase, Zustand v5, Framer Motion, Vitest). Button component added.

**Remaining steps:**

- [ ] **Step 1: Add missing shadcn components**

```bash
cd family-quest
npx shadcn@latest add card input label
```

- [ ] **Step 2: Install Google AI SDK**

```bash
npm install @google/generative-ai
```

- [ ] **Step 3: Verify project runs**

```bash
npm run dev
```

Expected: App runs at http://localhost:3000

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: add shadcn components and Google AI SDK"
```

---

### Task 2: Design System - Colors & Typography

> **Note:** Tailwind v4 uses CSS-based configuration (no `tailwind.config.ts`). Colors use oklch format. The existing `globals.css` already has the Tailwind v4 structure with `@theme inline` and `@custom-variant dark`. We update the CSS variables and add the serif font.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update globals.css with Family Quest colors and success token**

Replace the `:root` and `.dark` blocks in `src/app/globals.css` with the Family Quest color palette, and add success/warning color tokens to the `@theme inline` block.

```css
/* Add to the @theme inline block, after existing color tokens */
@theme inline {
  /* ... keep existing tokens ... */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --font-serif: var(--font-serif);
}

:root {
  /* Light mode - warm cream theme */
  --background: oklch(0.98 0.005 80);
  --foreground: oklch(0.17 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.17 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.17 0 0);
  --primary: oklch(0.78 0.165 75);
  --primary-foreground: oklch(0.13 0.015 250);
  --secondary: oklch(0.62 0.10 230);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.92 0.01 240);
  --muted-foreground: oklch(0.50 0.01 240);
  --accent: oklch(0.92 0.01 240);
  --accent-foreground: oklch(0.17 0 0);
  --destructive: oklch(0.63 0.21 25);
  --success: oklch(0.70 0.15 165);
  --success-foreground: oklch(1 0 0);
  --warning: oklch(0.80 0.17 70);
  --warning-foreground: oklch(0.17 0 0);
  --border: oklch(0.90 0.01 240);
  --input: oklch(0.90 0.01 240);
  --ring: oklch(0.78 0.165 75);
  --radius: 0.75rem;
}

.dark {
  /* Dark mode - deep midnight theme (default) */
  --background: oklch(0.13 0.015 250);
  --foreground: oklch(0.98 0.005 80);
  --card: oklch(0.17 0.015 245);
  --card-foreground: oklch(0.98 0.005 80);
  --popover: oklch(0.17 0.015 245);
  --popover-foreground: oklch(0.98 0.005 80);
  --primary: oklch(0.78 0.165 75);
  --primary-foreground: oklch(0.13 0.015 250);
  --secondary: oklch(0.62 0.10 230);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.22 0.02 235);
  --muted-foreground: oklch(0.73 0.01 245);
  --accent: oklch(0.22 0.02 235);
  --accent-foreground: oklch(0.98 0.005 80);
  --destructive: oklch(0.63 0.21 25);
  --success: oklch(0.70 0.15 165);
  --success-foreground: oklch(1 0 0);
  --warning: oklch(0.80 0.17 70);
  --warning-foreground: oklch(0.17 0 0);
  --border: oklch(0.25 0.02 240);
  --input: oklch(0.25 0.02 240);
  --ring: oklch(0.78 0.165 75);
}
```

Also update the `@layer base` block to add serif headings:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif;
  }
}
```

- [ ] **Step 2: Add Playfair Display font via next/font**

Update `src/app/layout.tsx` to add the serif font alongside the existing Geist fonts:

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Playfair_Display } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "Family Quest",
  description: "AI-powered D&D adventures for families",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

> **Note:** `viewport` is a separate export in Next.js 16, NOT inside the `metadata` object.

- [ ] **Step 3: Verify fonts and colors work**

```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-primary">Family Quest</h1>
        <p className="text-muted-foreground">Your adventure awaits</p>
      </div>
    </main>
  )
}
```

Run: `npm run dev`
Expected: Gold heading with serif font, muted subtitle, dark midnight background

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add design system with custom colors and typography"
```

---

### Task 3: Utility Components

> **Note:** The `cn()` utility already exists at `src/lib/utils.ts` (created by shadcn). `clsx` and `tailwind-merge` are already installed. We only need to create the layout components.

**Files:**
- Create: `src/components/layout/page-container.tsx`
- Create: `src/components/layout/loading-shimmer.tsx`

- [ ] **Step 1: Create PageContainer component** 

```typescript
// src/components/layout/page-container.tsx
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn(
      "min-h-screen bg-background px-4 py-8",
      "flex flex-col items-center",
      className
    )}>
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create LoadingShimmer component**

```typescript
// src/components/layout/loading-shimmer.tsx
import { cn } from "@/lib/utils"

interface LoadingShimmerProps {
  className?: string
}

export function LoadingShimmer({ className }: LoadingShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-card via-muted to-card",
        "rounded-lg",
        className
      )}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add utility components (PageContainer, LoadingShimmer)"
```

---

### Task 4: Supabase Setup

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/types/database.ts`
- Modify: `.env.local`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com and create a new project named "family-quest".
Copy the project URL and anon key.

- [ ] **Step 2: Create .env.local with Supabase credentials**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Create database schema migration**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Families table (parent accounts)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,  -- nullable for anonymous auth
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Settings
  adventure_style TEXT DEFAULT 'realistic' CHECK (adventure_style IN ('whimsical', 'realistic', 'dark')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  dice_preference TEXT DEFAULT 'digital' CHECK (dice_preference IN ('physical', 'digital')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'da'))
);

-- Players table (kids in the family)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 18),
  color TEXT DEFAULT '#f0a500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adventures table
CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Dungeons & Dragons',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  state JSONB DEFAULT '{}'::jsonb
);

-- Characters table (per adventure, per player)
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID REFERENCES adventures(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('warrior', 'wizard', 'rogue', 'ranger')),
  gender TEXT DEFAULT 'neutral' CHECK (gender IN ('male', 'female', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(adventure_id, player_id)
);

-- Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users — including anonymous — can access their own data)
CREATE POLICY "Users can create own family" ON families
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own family" ON families
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own family" ON families
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own players" ON players
  FOR ALL USING (family_id = auth.uid());

CREATE POLICY "Users can manage own adventures" ON adventures
  FOR ALL USING (family_id = auth.uid());

CREATE POLICY "Users can manage own characters" ON characters
  FOR ALL USING (
    adventure_id IN (
      SELECT id FROM adventures WHERE family_id = auth.uid()
    )
  );
```

- [ ] **Step 4: Apply migration via Supabase dashboard**

Go to Supabase Dashboard > SQL Editor > Paste and run the migration.

- [ ] **Step 5: Create Supabase browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 6: Create Supabase server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  )
}
```

- [ ] **Step 7: Create database types**

```typescript
// src/types/database.ts
export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          email: string | null
          created_at: string
          adventure_style: 'whimsical' | 'realistic' | 'dark'
          difficulty: 'easy' | 'medium' | 'hard'
          dice_preference: 'physical' | 'digital'
          language: 'en' | 'da'
        }
        Insert: {
          id?: string
          email?: string | null
          created_at?: string
          adventure_style?: 'whimsical' | 'realistic' | 'dark'
          difficulty?: 'easy' | 'medium' | 'hard'
          dice_preference?: 'physical' | 'digital'
          language?: 'en' | 'da'
        }
        Update: Partial<Database['public']['Tables']['families']['Insert']>
      }
      players: {
        Row: {
          id: string
          family_id: string
          name: string
          age: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          age: number
          color?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      adventures: {
        Row: {
          id: string
          family_id: string
          name: string
          created_at: string
          last_played_at: string | null
          state: Record<string, unknown>
        }
        Insert: {
          id?: string
          family_id: string
          name?: string
          created_at?: string
          last_played_at?: string | null
          state?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['adventures']['Insert']>
      }
      characters: {
        Row: {
          id: string
          adventure_id: string
          player_id: string
          name: string
          class: 'warrior' | 'wizard' | 'rogue' | 'ranger'
          gender: 'male' | 'female' | 'neutral'
          created_at: string
        }
        Insert: {
          id?: string
          adventure_id: string
          player_id: string
          name: string
          class: 'warrior' | 'wizard' | 'rogue' | 'ranger'
          gender?: 'male' | 'female' | 'neutral'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['characters']['Insert']>
      }
    }
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add Supabase setup with database schema"
```

---

### Task 4b: Anonymous Auth & Session Management

> **Note:** MVP uses Supabase anonymous auth. No signup form needed. A session is created silently on first visit, giving a UID for RLS policies and data persistence. Users can optionally upgrade to email auth later (post-MVP).

**Files:**
- Create: `src/lib/supabase/auth.ts`
- Modify: `src/app/layout.tsx` (add auth provider)

- [ ] **Step 1: Enable anonymous sign-ins in Supabase dashboard**

Go to Supabase Dashboard > Authentication > Settings > Enable "Allow anonymous sign-ins"

- [ ] **Step 2: Create auth helper**

```typescript
// src/lib/supabase/auth.ts
'use client'

import { createClient } from './client'

export async function ensureSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // Create anonymous session
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Failed to create anonymous session:', error)
      return null
    }

    // Create family row for the new user
    if (data.user) {
      await supabase.from('families').insert({
        id: data.user.id,
      })
    }

    return data.session
  }

  return session
}
```

- [ ] **Step 3: Add session initialization to the Welcome page**

The `ensureSession()` call should happen when the user taps "Begin Your Journey" — not on page load, to avoid creating sessions for visitors who bounce.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add anonymous auth with auto-session creation"
```

---

### Task 5: Game Types & Class Definitions

**Files:**
- Create: `src/types/game.ts`
- Create: `src/lib/game/classes.ts`
- Create: `tests/lib/game/classes.test.ts`

- [ ] **Step 1: Create game types**

```typescript
// src/types/game.ts
export type Stat = 'strength' | 'magic' | 'agility' | 'heart'
export type CharacterClass = 'warrior' | 'wizard' | 'rogue' | 'ranger'
export type AdventureStyle = 'whimsical' | 'realistic' | 'dark'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SceneFit = 'good' | 'okay' | 'risky'
export type OutcomeType = 'success' | 'partial' | 'failure'

export interface ClassDefinition {
  name: CharacterClass
  displayName: string
  emoji: string
  description: string
  goodAt: string
  notGreatAt: string
  stats: Record<Stat, number>
}

export interface ActionOption {
  id: string
  text: string
  stat: Stat
  sceneFit: SceneFit
  sceneFitReason: string // Internal, not shown to players
}

export interface GameState {
  currentScene: string
  currentPlayerId: string
  turnHistory: TurnRecord[]
  storyHistory: string[]
}

export interface TurnRecord {
  playerId: string
  actionChosen: string
  stat: Stat
  sceneFit: SceneFit
  diceRoll: number
  outcome: OutcomeType
  narrativeResult: string
}
```

- [ ] **Step 2: Write failing test for class definitions**

```typescript
// tests/lib/game/classes.test.ts
import { describe, it, expect } from 'vitest'
import { CLASS_DEFINITIONS, getClassStats, getStatBonus } from '@/lib/game/classes'

describe('CLASS_DEFINITIONS', () => {
  it('should have 4 classes', () => {
    expect(Object.keys(CLASS_DEFINITIONS)).toHaveLength(4)
  })

  it('should have all required classes', () => {
    expect(CLASS_DEFINITIONS.warrior).toBeDefined()
    expect(CLASS_DEFINITIONS.wizard).toBeDefined()
    expect(CLASS_DEFINITIONS.rogue).toBeDefined()
    expect(CLASS_DEFINITIONS.ranger).toBeDefined()
  })

  it('should have 12 total stat points per class', () => {
    Object.values(CLASS_DEFINITIONS).forEach(classDef => {
      const total = Object.values(classDef.stats).reduce((a, b) => a + b, 0)
      expect(total).toBe(12)
    })
  })
})

describe('getClassStats', () => {
  it('should return correct stats for warrior', () => {
    const stats = getClassStats('warrior')
    expect(stats.strength).toBe(5)
    expect(stats.magic).toBe(1)
    expect(stats.agility).toBe(2)
    expect(stats.heart).toBe(4)
  })
})

describe('getStatBonus', () => {
  it('should return stat value as bonus', () => {
    expect(getStatBonus(5)).toBe(5)
    expect(getStatBonus(1)).toBe(1)
    expect(getStatBonus(3)).toBe(3)
  })
})
```

- [ ] **Step 3: Create vitest config**

> **Note:** vitest, @vitejs/plugin-react, jsdom, and @testing-library/react are already installed.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx vitest run tests/lib/game/classes.test.ts
```

Expected: FAIL - Cannot find module '@/lib/game/classes'

- [ ] **Step 5: Implement class definitions**

```typescript
// src/lib/game/classes.ts
import type { CharacterClass, ClassDefinition, Stat } from '@/types/game'

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  warrior: {
    name: 'warrior',
    displayName: 'Warrior',
    emoji: '⚔️',
    description: 'A brave fighter who protects their friends',
    goodAt: 'Fighting, protecting friends',
    notGreatAt: 'Sneaking, casting spells',
    stats: {
      strength: 5,
      magic: 1,
      agility: 2,
      heart: 4,
    },
  },
  wizard: {
    name: 'wizard',
    displayName: 'Wizard',
    emoji: '🧙',
    description: 'A clever spellcaster who solves puzzles with magic',
    goodAt: 'Casting spells, solving puzzles',
    notGreatAt: 'Heavy lifting, direct combat',
    stats: {
      strength: 1,
      magic: 5,
      agility: 4,
      heart: 2,
    },
  },
  rogue: {
    name: 'rogue',
    displayName: 'Rogue',
    emoji: '🗡️',
    description: 'A sneaky treasure hunter who moves like a shadow',
    goodAt: 'Sneaking, finding treasure',
    notGreatAt: 'Talking their way out, brute force',
    stats: {
      strength: 2,
      magic: 3,
      agility: 5,
      heart: 2,
    },
  },
  ranger: {
    name: 'ranger',
    displayName: 'Ranger',
    emoji: '🏹',
    description: 'A nature expert who tracks and helps others',
    goodAt: 'Tracking, archery, nature',
    notGreatAt: 'Magic spells, heavy combat',
    stats: {
      strength: 2,
      magic: 2,
      agility: 4,
      heart: 4,
    },
  },
}

export function getClassStats(characterClass: CharacterClass): Record<Stat, number> {
  return CLASS_DEFINITIONS[characterClass].stats
}

export function getStatBonus(statValue: number): number {
  return statValue
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run tests/lib/game/classes.test.ts
```

Expected: PASS

- [ ] **Step 7: Add test script to package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add game types and class definitions with tests"
```

---

### Task 6: Game Mechanics - Success Calculation

**Files:**
- Create: `src/lib/game/mechanics.ts`
- Create: `tests/lib/game/mechanics.test.ts`

- [ ] **Step 1: Write failing tests for mechanics**

```typescript
// tests/lib/game/mechanics.test.ts
import { describe, it, expect } from 'vitest'
import {
  calculateSceneFitBonus,
  calculateThreshold,
  calculateOutcome,
  type SuccessCalculation
} from '@/lib/game/mechanics'

describe('calculateSceneFitBonus', () => {
  it('should return 2 for good fit', () => {
    expect(calculateSceneFitBonus('good')).toBe(2)
  })

  it('should return 1 for okay fit', () => {
    expect(calculateSceneFitBonus('okay')).toBe(1)
  })

  it('should return 0 for risky fit', () => {
    expect(calculateSceneFitBonus('risky')).toBe(0)
  })
})

describe('calculateOutcome', () => {
  // Combined Score = Scene Fit + Stat + Dice
  // Easy: Success 8+, Partial 6-7, Fail ≤5
  // Medium: Success 9+, Partial 7-8, Fail ≤6
  // Hard: Success 10+, Partial 8-9, Fail ≤7

  it('should return success when combined score meets threshold (medium)', () => {
    // sceneFit: good (2) + stat: 5 + dice: 3 = 10 >= 9
    const result = calculateOutcome({
      sceneFit: 'good',
      statValue: 5,
      diceRoll: 3,
      difficulty: 'medium',
    })
    expect(result.outcome).toBe('success')
    expect(result.combinedScore).toBe(10)
  })

  it('should return partial when score is in partial range (medium)', () => {
    // sceneFit: good (2) + stat: 2 + dice: 3 = 7 (partial range 7-8)
    const result = calculateOutcome({
      sceneFit: 'good',
      statValue: 2,
      diceRoll: 3,
      difficulty: 'medium',
    })
    expect(result.outcome).toBe('partial')
  })

  it('should return failure when score is below partial range (medium)', () => {
    // sceneFit: risky (0) + stat: 2 + dice: 2 = 4 <= 6
    const result = calculateOutcome({
      sceneFit: 'risky',
      statValue: 2,
      diceRoll: 2,
      difficulty: 'medium',
    })
    expect(result.outcome).toBe('failure')
  })

  it('should use easier thresholds for easy difficulty', () => {
    // sceneFit: risky (0) + stat: 3 + dice: 3 = 6 (partial on easy 6-7)
    const result = calculateOutcome({
      sceneFit: 'risky',
      statValue: 3,
      diceRoll: 3,
      difficulty: 'easy',
    })
    expect(result.outcome).toBe('partial')
  })

  it('should use harder thresholds for hard difficulty', () => {
    // sceneFit: good (2) + stat: 5 + dice: 2 = 9 (partial on hard 8-9)
    const result = calculateOutcome({
      sceneFit: 'good',
      statValue: 5,
      diceRoll: 2,
      difficulty: 'hard',
    })
    expect(result.outcome).toBe('partial')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/game/mechanics.test.ts
```

Expected: FAIL - Cannot find module

- [ ] **Step 3: Implement mechanics**

```typescript
// src/lib/game/mechanics.ts
import type { SceneFit, Difficulty, OutcomeType } from '@/types/game'

const SCENE_FIT_BONUS: Record<SceneFit, number> = {
  good: 2,
  okay: 1,
  risky: 0,
}

const DIFFICULTY_THRESHOLDS: Record<Difficulty, { success: number; partial: number }> = {
  easy: { success: 8, partial: 6 },
  medium: { success: 9, partial: 7 },
  hard: { success: 10, partial: 8 },
}

export interface SuccessCalculation {
  sceneFit: SceneFit
  statValue: number
  diceRoll: number
  difficulty: Difficulty
}

export interface OutcomeResult {
  outcome: OutcomeType
  combinedScore: number
  threshold: { success: number; partial: number }
}

export function calculateSceneFitBonus(sceneFit: SceneFit): number {
  return SCENE_FIT_BONUS[sceneFit]
}

export function calculateThreshold(difficulty: Difficulty): { success: number; partial: number } {
  return DIFFICULTY_THRESHOLDS[difficulty]
}

export function calculateOutcome(calc: SuccessCalculation): OutcomeResult {
  const sceneFitBonus = calculateSceneFitBonus(calc.sceneFit)
  const combinedScore = sceneFitBonus + calc.statValue + calc.diceRoll
  const threshold = calculateThreshold(calc.difficulty)

  let outcome: OutcomeType
  if (combinedScore >= threshold.success) {
    outcome = 'success'
  } else if (combinedScore >= threshold.partial) {
    outcome = 'partial'
  } else {
    outcome = 'failure'
  }

  return {
    outcome,
    combinedScore,
    threshold,
  }
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/game/mechanics.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add game mechanics with three-factor success calculation"
```

---

### Task 7: Player Rotation Logic

**Files:**
- Create: `src/lib/game/rotation.ts`
- Create: `tests/lib/game/rotation.test.ts`

- [ ] **Step 1: Write failing tests for rotation**

```typescript
// tests/lib/game/rotation.test.ts
import { describe, it, expect } from 'vitest'
import { getNextPlayer, canAIChoosePlayer } from '@/lib/game/rotation'

const players = [
  { id: 'p1', name: 'Luna' },
  { id: 'p2', name: 'Max' },
  { id: 'p3', name: 'Zoe' },
]

describe('canAIChoosePlayer', () => {
  it('should allow AI to choose if no player has waited 2 turns', () => {
    const turnHistory = [
      { playerId: 'p1' },
      { playerId: 'p2' },
    ]
    expect(canAIChoosePlayer('p3', players, turnHistory as any)).toBe(true)
  })

  it('should force specific player if they waited 2 turns', () => {
    const turnHistory = [
      { playerId: 'p2' },
      { playerId: 'p3' },
      { playerId: 'p2' },
      { playerId: 'p3' },
    ]
    // p1 hasn't played in last 4 turns (2+ turns wait)
    expect(canAIChoosePlayer('p2', players, turnHistory as any)).toBe(false)
    expect(canAIChoosePlayer('p1', players, turnHistory as any)).toBe(true)
  })
})

describe('getNextPlayer', () => {
  it('should return forced player if someone waited too long', () => {
    const turnHistory = [
      { playerId: 'p2' },
      { playerId: 'p3' },
      { playerId: 'p2' },
      { playerId: 'p3' },
    ]
    const result = getNextPlayer(players, turnHistory as any, 'p2')
    expect(result.id).toBe('p1') // p1 forced
  })

  it('should return AI preferred player if no one forced', () => {
    const turnHistory = [
      { playerId: 'p1' },
    ]
    const result = getNextPlayer(players, turnHistory as any, 'p2')
    expect(result.id).toBe('p2') // AI chose p2
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/game/rotation.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement rotation logic**

```typescript
// src/lib/game/rotation.ts
import type { TurnRecord } from '@/types/game'

interface Player {
  id: string
  name: string
}

const MAX_WAIT_TURNS = 2

export function getTurnsSinceLastPlayed(
  playerId: string,
  turnHistory: TurnRecord[]
): number {
  if (turnHistory.length === 0) return 0

  for (let i = turnHistory.length - 1; i >= 0; i--) {
    if (turnHistory[i].playerId === playerId) {
      return turnHistory.length - 1 - i
    }
  }

  // Player hasn't played at all in history
  return turnHistory.length
}

export function getPlayerWhoMustPlay(
  players: Player[],
  turnHistory: TurnRecord[]
): Player | null {
  for (const player of players) {
    const turnsSince = getTurnsSinceLastPlayed(player.id, turnHistory)
    if (turnsSince >= MAX_WAIT_TURNS) {
      return player
    }
  }
  return null
}

export function canAIChoosePlayer(
  preferredPlayerId: string,
  players: Player[],
  turnHistory: TurnRecord[]
): boolean {
  const forcedPlayer = getPlayerWhoMustPlay(players, turnHistory)

  if (!forcedPlayer) return true
  return forcedPlayer.id === preferredPlayerId
}

export function getNextPlayer(
  players: Player[],
  turnHistory: TurnRecord[],
  aiPreferredPlayerId: string
): Player {
  const forcedPlayer = getPlayerWhoMustPlay(players, turnHistory)

  if (forcedPlayer) {
    return forcedPlayer
  }

  return players.find(p => p.id === aiPreferredPlayerId) || players[0]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/game/rotation.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add player rotation logic with max 2-turn wait"
```

---

## Phase 2: Onboarding Screens

### Task 8: Welcome Screen

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/language-toggle.tsx`

- [ ] **Step 1: Create LanguageToggle component**

```typescript
// src/components/layout/language-toggle.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const [language, setLanguage] = useState<'en' | 'da'>('en')

  const toggle = () => {
    setLanguage(prev => prev === 'en' ? 'da' : 'en')
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "text-2xl hover:scale-110 transition-transform",
        className
      )}
      aria-label={`Switch to ${language === 'en' ? 'Danish' : 'English'}`}
    >
      {language === 'en' ? '🇬🇧' : '🇩🇰'}
    </button>
  )
}
```

- [ ] **Step 2: Create Header component**

```typescript
// src/components/layout/header.tsx
import { LanguageToggle } from './language-toggle'

export function Header() {
  return (
    <header className="fixed top-0 right-0 p-4">
      <LanguageToggle />
    </header>
  )
}
```

- [ ] **Step 3: Update Welcome page**

> **Note:** shadcn v4 uses @base-ui/react which does NOT have `asChild`. Use the `render` prop to compose Button + Link.

```typescript
// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'

export default function WelcomePage() {
  return (
    <>
      <Header />
      <PageContainer className="justify-center">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-serif text-primary">
              Family Quest
            </h1>
            <p className="text-xl text-muted-foreground">
              Embark on magical adventures together
            </p>
          </div>

          <div className="space-y-3 pt-8">
            <Button render={<Link href="/players" />} size="lg" className="w-full text-lg">
              Begin Your Journey
            </Button>

            <p className="text-sm text-muted-foreground">
              No account needed to start
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
```

- [ ] **Step 4: Verify welcome screen**

```bash
npm run dev
```

Open http://localhost:3000
Expected: Gold "Family Quest" heading, "Begin Your Journey" button, language flag in corner

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add welcome screen with language toggle"
```

---

### Task 9: Players Screen

> **Note:** shadcn v4's `Card` component has built-in `py-4` and `gap-4`. When overriding with `className="p-4"`, the custom padding takes precedence. Card also uses `ring-1` instead of `border` for its outline.

**Files:**
- Create: `src/app/players/page.tsx`
- Create: `src/components/onboarding/player-card.tsx`
- Create: `src/stores/game-store.ts`

- [ ] **Step 1: Create Zustand store for local state**

```typescript
// src/stores/game-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterClass, AdventureStyle, Difficulty, TurnRecord } from '@/types/game'

interface Player {
  id: string
  name: string
  age: number
  color: string
}

interface Character {
  playerId: string
  name: string
  class: CharacterClass
  gender: 'male' | 'female' | 'neutral'
}

interface GameStore {
  // Players
  players: Player[]
  addPlayer: (player: Omit<Player, 'id'>) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void

  // Selected players for current session
  selectedPlayerIds: string[]
  selectPlayer: (id: string) => void
  deselectPlayer: (id: string) => void

  // Settings
  adventureStyle: AdventureStyle
  difficulty: Difficulty
  dicePreference: 'physical' | 'digital'
  setSettings: (settings: Partial<{
    adventureStyle: AdventureStyle
    difficulty: Difficulty
    dicePreference: 'physical' | 'digital'
  }>) => void

  // Characters (for current adventure)
  characters: Character[]
  setCharacter: (character: Character) => void
  clearCharacters: () => void

  // Adventure state (persisted — survives page refresh)
  currentScene: string
  storyHistory: string[]
  turnHistory: TurnRecord[]
  currentPlayerIndex: number
  updateAdventureState: (state: Partial<{
    currentScene: string
    storyHistory: string[]
    turnHistory: TurnRecord[]
    currentPlayerIndex: number
  }>) => void
  resetAdventure: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // Players
      players: [],
      addPlayer: (player) => set((state) => ({
        players: [...state.players, { ...player, id: crypto.randomUUID() }]
      })),
      removePlayer: (id) => set((state) => ({
        players: state.players.filter(p => p.id !== id),
        selectedPlayerIds: state.selectedPlayerIds.filter(pid => pid !== id)
      })),
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      // Selected players
      selectedPlayerIds: [],
      selectPlayer: (id) => set((state) => ({
        selectedPlayerIds: [...state.selectedPlayerIds, id]
      })),
      deselectPlayer: (id) => set((state) => ({
        selectedPlayerIds: state.selectedPlayerIds.filter(pid => pid !== id)
      })),

      // Settings
      adventureStyle: 'realistic',
      difficulty: 'medium',
      dicePreference: 'digital',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),

      // Characters
      characters: [],
      setCharacter: (character) => set((state) => ({
        characters: [
          ...state.characters.filter(c => c.playerId !== character.playerId),
          character
        ]
      })),
      clearCharacters: () => set({ characters: [] }),

      // Adventure state (persisted)
      currentScene: '',
      storyHistory: [],
      turnHistory: [],
      currentPlayerIndex: 0,
      updateAdventureState: (state) => set((prev) => ({ ...prev, ...state })),
      resetAdventure: () => set({
        currentScene: '',
        storyHistory: [],
        turnHistory: [],
        currentPlayerIndex: 0,
      }),
    }),
    {
      name: 'family-quest-storage',
    }
  )
)
```

- [ ] **Step 2: Create PlayerCard component**

```typescript
// src/components/onboarding/player-card.tsx
'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PlayerCardProps {
  id: string
  name: string
  age: number
  color: string
  selected?: boolean
  onSelect?: () => void
  onRemove?: () => void
  selectable?: boolean
}

export function PlayerCard({
  name,
  age,
  color,
  selected,
  onSelect,
  onRemove,
  selectable = false,
}: PlayerCardProps) {
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all",
        "bg-card",
        selectable && "cursor-pointer hover:border-primary/50",
        selected ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">Age {age}</p>
        </div>
        {selectable && (
          <div className={cn(
            "w-6 h-6 rounded-full border-2 transition-colors",
            selected
              ? "bg-primary border-primary"
              : "border-muted-foreground"
          )}>
            {selected && (
              <svg className="w-full h-full text-primary-foreground p-0.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
        )}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          ×
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create Players page**

```typescript
// src/app/players/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { PlayerCard } from '@/components/onboarding/player-card'
import { useGameStore } from '@/stores/game-store'

export default function PlayersPage() {
  const router = useRouter()
  const {
    players,
    addPlayer,
    removePlayer,
    selectedPlayerIds,
    selectPlayer,
    deselectPlayer
  } = useGameStore()

  const [isAdding, setIsAdding] = useState(players.length === 0)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState('')

  const handleAddPlayer = () => {
    if (newName && newAge) {
      addPlayer({
        name: newName,
        age: parseInt(newAge),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })
      setNewName('')
      setNewAge('')
      setIsAdding(false)
    }
  }

  const togglePlayerSelection = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      deselectPlayer(id)
    } else if (selectedPlayerIds.length < 4) {
      selectPlayer(id)
    }
  }

  const canContinue = selectedPlayerIds.length >= 1

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">Who's Playing?</h1>
            <p className="text-muted-foreground">
              Select 1-4 adventurers for today's quest
            </p>
          </div>

          <div className="space-y-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                {...player}
                selectable
                selected={selectedPlayerIds.includes(player.id)}
                onSelect={() => togglePlayerSelection(player.id)}
                onRemove={() => removePlayer(player.id)}
              />
            ))}
          </div>

          {isAdding ? (
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter player name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="18"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="Enter age"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPlayer} className="flex-1">
                  Add Player
                </Button>
                {players.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              + Add Another Player
            </Button>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={() => router.push('/settings')}
          >
            Continue ({selectedPlayerIds.length} selected)
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
```

- [ ] **Step 4: Verify players page**

```bash
npm run dev
```

Navigate to /players
Expected: Can add players, select them with checkboxes, continue button shows count

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add players screen with add/select functionality"
```

---

### ~~Task 10: Adventure Selection Screen~~ (Removed for MVP)

> **Skipped.** Only one adventure exists (D&D). Players page navigates directly to Settings. Adventure selection will be added post-MVP when multiple adventures are available.

---

### Task 11: Settings Screen

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/onboarding/style-option.tsx`
- Create: `src/components/onboarding/difficulty-option.tsx`

- [ ] **Step 1: Create StyleOption component**

```typescript
// src/components/onboarding/style-option.tsx
'use client'

import { cn } from '@/lib/utils'
import type { AdventureStyle } from '@/types/game'

interface StyleOptionProps {
  style: AdventureStyle
  selected: boolean
  onSelect: () => void
}

const styleData: Record<AdventureStyle, {
  name: string
  ages: string
  emoji: string
  description: string
  bgClass: string
}> = {
  whimsical: {
    name: 'Whimsical',
    ages: '4-7',
    emoji: '🌈',
    description: 'Bright, gentle, storybook adventures',
    bgClass: 'from-orange-400 to-amber-400',
  },
  realistic: {
    name: 'Realistic',
    ages: '7-12',
    emoji: '⚔️',
    description: 'Exciting fantasy with action and heroes',
    bgClass: 'from-emerald-600 to-teal-600',
  },
  dark: {
    name: 'Dark',
    ages: '13+',
    emoji: '🌑',
    description: 'Atmospheric with complex themes',
    bgClass: 'from-slate-700 to-slate-900',
  },
}

export function StyleOption({ style, selected, onSelect }: StyleOptionProps) {
  const data = styleData[style]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg overflow-hidden transition-all",
        "border-2",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <div className={cn("h-16 flex items-center justify-center bg-gradient-to-r", data.bgClass)}>
        <span className="text-3xl">{data.emoji}</span>
      </div>
      <div className="p-3 bg-card">
        <div className="flex justify-between items-center mb-1">
          <span className="font-serif text-foreground">{data.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {data.ages}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create DifficultyOption component**

```typescript
// src/components/onboarding/difficulty-option.tsx
'use client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/game'

interface DifficultyOptionProps {
  difficulty: Difficulty
  selected: boolean
  onSelect: () => void
}

const difficultyData: Record<Difficulty, {
  name: string
  emoji: string
  description: string
  colorClass: string
}> = {
  easy: {
    name: 'Easy',
    emoji: '🌱',
    description: 'Gentle challenges, quick wins',
    colorClass: 'text-success border-success/30',
  },
  medium: {
    name: 'Medium',
    emoji: '⚔️',
    description: 'Balanced challenges',
    colorClass: 'text-primary border-primary/30',
  },
  hard: {
    name: 'Hard',
    emoji: '🔥',
    description: 'Real consequences, earned victories',
    colorClass: 'text-destructive border-destructive/30',
  },
}

export function DifficultyOption({ difficulty, selected, onSelect }: DifficultyOptionProps) {
  const data = difficultyData[difficulty]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex-1 p-3 rounded-lg border-2 transition-all",
        "bg-card",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : `border-border hover:${data.colorClass}`
      )}
    >
      <span className="text-2xl block mb-1">{data.emoji}</span>
      <span className={cn("font-medium block", selected ? "text-primary" : data.colorClass.split(' ')[0])}>
        {data.name}
      </span>
      <span className="text-xs text-muted-foreground">{data.description}</span>
    </button>
  )
}
```

- [ ] **Step 3: Create Settings page**

```typescript
// src/app/settings/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { StyleOption } from '@/components/onboarding/style-option'
import { DifficultyOption } from '@/components/onboarding/difficulty-option'
import { useGameStore } from '@/stores/game-store'
import type { AdventureStyle, Difficulty } from '@/types/game'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const {
    adventureStyle,
    difficulty,
    dicePreference,
    setSettings
  } = useGameStore()

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">Settings</h1>
            <p className="text-muted-foreground">
              Customize your adventure experience
            </p>
          </div>

          {/* Adventure Style */}
          <div className="space-y-3">
            <Label className="text-lg">Adventure Style</Label>
            <div className="space-y-2">
              {(['whimsical', 'realistic', 'dark'] as AdventureStyle[]).map((style) => (
                <StyleOption
                  key={style}
                  style={style}
                  selected={adventureStyle === style}
                  onSelect={() => setSettings({ adventureStyle: style })}
                />
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <Label className="text-lg">Difficulty</Label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <DifficultyOption
                  key={diff}
                  difficulty={diff}
                  selected={difficulty === diff}
                  onSelect={() => setSettings({ difficulty: diff })}
                />
              ))}
            </div>
          </div>

          {/* Dice Preference */}
          <div className="space-y-3">
            <Label className="text-lg">Dice</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ dicePreference: 'digital' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card",
                  dicePreference === 'digital'
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🎲</span>
                <span className="font-medium">Digital</span>
                <span className="text-xs text-muted-foreground block">Tap to roll</span>
              </button>
              <button
                onClick={() => setSettings({ dicePreference: 'physical' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card",
                  dicePreference === 'physical'
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🎯</span>
                <span className="font-medium">Physical</span>
                <span className="text-xs text-muted-foreground block">Use real dice</span>
              </button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/characters')}
          >
            Continue to Characters
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
```

- [ ] **Step 4: Verify settings page**

```bash
npm run dev
```

Navigate through flow to /settings
Expected: Can select style, difficulty, dice preference

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add settings screen with style, difficulty, dice options"
```

---

### Task 12: Character Selection Screen

**Files:**
- Create: `src/app/characters/page.tsx`
- Create: `src/components/onboarding/class-card.tsx`

- [ ] **Step 1: Create ClassCard component**

```typescript
// src/components/onboarding/class-card.tsx
'use client'

import { cn } from '@/lib/utils'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import type { CharacterClass, Stat } from '@/types/game'

interface ClassCardProps {
  characterClass: CharacterClass
  selected: boolean
  onSelect: () => void
}

const statEmoji: Record<Stat, string> = {
  strength: '💪',
  magic: '✨',
  agility: '🏃',
  heart: '❤️',
}

export function ClassCard({ characterClass, selected, onSelect }: ClassCardProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        "bg-card",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl">{classDef.emoji}</span>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-foreground mb-1">
            {classDef.displayName}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {classDef.description}
          </p>

          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(classDef.stats) as [Stat, number][]).map(([stat, value]) => (
              <div
                key={stat}
                className="flex items-center gap-1 text-xs"
              >
                <span>{statEmoji[stat]}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full mx-0.5",
                        i < value ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create Characters page**

```typescript
// src/app/characters/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { ClassCard } from '@/components/onboarding/class-card'
import { useGameStore } from '@/stores/game-store'
import type { CharacterClass } from '@/types/game'
import { cn } from '@/lib/utils'

export default function CharactersPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters, setCharacter } = useGameStore()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const currentPlayer = selectedPlayers[currentPlayerIndex]

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    characters.find(c => c.playerId === currentPlayer?.id)?.class || null
  )
  const [characterName, setCharacterName] = useState(
    characters.find(c => c.playerId === currentPlayer?.id)?.name || ''
  )
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>(
    characters.find(c => c.playerId === currentPlayer?.id)?.gender || 'neutral'
  )

  const handleContinue = () => {
    if (!selectedClass || !characterName || !currentPlayer) return

    setCharacter({
      playerId: currentPlayer.id,
      name: characterName,
      class: selectedClass,
      gender,
    })

    if (currentPlayerIndex < selectedPlayers.length - 1) {
      // Move to next player
      setCurrentPlayerIndex(prev => prev + 1)
      const nextPlayer = selectedPlayers[currentPlayerIndex + 1]
      const existingChar = characters.find(c => c.playerId === nextPlayer.id)
      setSelectedClass(existingChar?.class || null)
      setCharacterName(existingChar?.name || '')
      setGender(existingChar?.gender || 'neutral')
    } else {
      // All done, start the game
      router.push('/play')
    }
  }

  if (!currentPlayer) {
    router.push('/players')
    return null
  }

  const isLastPlayer = currentPlayerIndex === selectedPlayers.length - 1

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Player {currentPlayerIndex + 1} of {selectedPlayers.length}
            </p>
            <h1 className="text-3xl font-serif text-primary">
              {currentPlayer.name}'s Character
            </h1>
          </div>

          {/* Character Name */}
          <div className="space-y-2">
            <Label>Character Name</Label>
            <Input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder={`${currentPlayer.name} the Brave`}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Avatar Style</Label>
            <div className="flex gap-2">
              {(['male', 'female', 'neutral'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border-2 transition-all capitalize",
                    gender === g
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Class Selection */}
          <div className="space-y-3">
            <Label>Choose Class</Label>
            <div className="space-y-2">
              {(['warrior', 'wizard', 'rogue', 'ranger'] as CharacterClass[]).map((cls) => (
                <ClassCard
                  key={cls}
                  characterClass={cls}
                  selected={selectedClass === cls}
                  onSelect={() => setSelectedClass(cls)}
                />
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedClass || !characterName}
            onClick={handleContinue}
          >
            {isLastPlayer ? 'Start Adventure!' : 'Next Player →'}
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
```

- [ ] **Step 3: Verify characters page**

```bash
npm run dev
```

Navigate through full flow to /characters
Expected: Can name character, select gender, pick class with stat display

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add character creation screen with class selection"
```

---

## Phase 3: Core Game Loop

### Task 13: Game Play Screen - Basic Structure

**Files:**
- Create: `src/app/play/page.tsx`
- Create: `src/components/game/scene-display.tsx`
- Create: `src/components/game/player-turn.tsx`

- [ ] **Step 1: Create PlayerTurn component**

```typescript
// src/components/game/player-turn.tsx
import { cn } from '@/lib/utils'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import type { CharacterClass } from '@/types/game'

interface PlayerTurnProps {
  playerName: string
  characterName: string
  characterClass: CharacterClass
}

export function PlayerTurn({ playerName, characterName, characterClass }: PlayerTurnProps) {
  const classDef = CLASS_DEFINITIONS[characterClass]

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-card rounded-full border border-primary/30">
      <span className="text-xl">{classDef.emoji}</span>
      <span className="text-sm">
        <span className="text-muted-foreground">{playerName} as </span>
        <span className="text-primary font-medium">{characterName}</span>
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create SceneDisplay component**

```typescript
// src/components/game/scene-display.tsx
'use client'

import { LoadingShimmer } from '@/components/layout/loading-shimmer'

interface SceneDisplayProps {
  imageUrl?: string
  isLoadingImage: boolean
  narration: string
  isLoadingNarration: boolean
}

export function SceneDisplay({
  imageUrl,
  isLoadingImage,
  narration,
  isLoadingNarration
}: SceneDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Scene Image */}
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        {isLoadingImage ? (
          <LoadingShimmer className="w-full h-full" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Scene"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center">
            <span className="text-4xl">🏰</span>
          </div>
        )}
      </div>

      {/* Narration */}
      <div className="bg-card rounded-lg p-4 border border-border">
        {isLoadingNarration ? (
          <div className="space-y-2">
            <LoadingShimmer className="h-4 w-full" />
            <LoadingShimmer className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-foreground leading-relaxed">{narration}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create basic Play page structure**

```typescript
// src/app/play/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { SceneDisplay } from '@/components/game/scene-display'
import { PlayerTurn } from '@/components/game/player-turn'
import { useGameStore } from '@/stores/game-store'
import { Button } from '@/components/ui/button'

// Mock data for now - will be replaced with AI
const MOCK_SCENE = {
  narration: "You stand at the entrance of a dark cave. The air is cool and damp. Strange sounds echo from within, and a faint glow flickers in the distance. What do you do?",
  imageUrl: undefined,
}

export default function PlayPage() {
  const router = useRouter()
  const { players, selectedPlayerIds, characters } = useGameStore()

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)

  const currentPlayer = selectedPlayers[currentPlayerIndex]
  const currentCharacter = characters.find(c => c.playerId === currentPlayer?.id)

  const [isLoadingNarration, setIsLoadingNarration] = useState(true)
  const [isLoadingImage, setIsLoadingImage] = useState(true)
  const [narration, setNarration] = useState('')

  useEffect(() => {
    // Simulate loading
    const timer1 = setTimeout(() => {
      setNarration(MOCK_SCENE.narration)
      setIsLoadingNarration(false)
    }, 1000)

    const timer2 = setTimeout(() => {
      setIsLoadingImage(false)
    }, 2000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  if (!currentPlayer || !currentCharacter) {
    return (
      <PageContainer className="justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No characters found</p>
          <Button onClick={() => router.push('/players')}>
            Start Over
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <PlayerTurn
          playerName={currentPlayer.name}
          characterName={currentCharacter.name}
          characterClass={currentCharacter.class}
        />

        <SceneDisplay
          narration={narration}
          isLoadingNarration={isLoadingNarration}
          isLoadingImage={isLoadingImage}
          imageUrl={MOCK_SCENE.imageUrl}
        />

        <div className="text-center text-muted-foreground">
          <p>Game loop components coming next...</p>
        </div>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 4: Verify play page**

```bash
npm run dev
```

Complete full onboarding flow, arrive at /play
Expected: See player turn indicator, scene with loading states, then mock narration

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add basic game play screen with scene display"
```

---

### Task 14: Action Picker Component

**Files:**
- Create: `src/components/game/action-picker.tsx`
- Modify: `src/app/play/page.tsx`

- [ ] **Step 1: Create ActionPicker component**

```typescript
// src/components/game/action-picker.tsx
'use client'

import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'

const statEmoji: Record<Stat, string> = {
  strength: '💪',
  magic: '✨',
  agility: '🏃',
  heart: '❤️',
}

interface ActionOption {
  id: string
  text: string
  stat: Stat
}

interface ActionPickerProps {
  options: ActionOption[]
  onSelect: (option: ActionOption) => void
  disabled?: boolean
}

export function ActionPicker({ options, onSelect, disabled }: ActionPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-muted-foreground text-sm">
        What do you do?
      </p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option)}
            disabled={disabled}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all",
              "bg-card border-border",
              !disabled && "hover:border-primary hover:bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{statEmoji[option.stat]}</span>
              <p className="text-foreground flex-1">{option.text}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add mock actions to Play page**

```typescript
// Update src/app/play/page.tsx - add mock actions and state

// Add this constant at the top
const MOCK_ACTIONS = [
  { id: '1', text: "I carefully enter the cave, looking for danger", stat: 'agility' as const },
  { id: '2', text: "I call out to see if anyone is there", stat: 'heart' as const },
  { id: '3', text: "I cast a light spell to see better", stat: 'magic' as const },
]

// Add state after other useState calls
const [selectedAction, setSelectedAction] = useState<typeof MOCK_ACTIONS[0] | null>(null)
const [gamePhase, setGamePhase] = useState<'scene' | 'action' | 'dice' | 'outcome'>('scene')

// Add handler
const handleActionSelect = (action: typeof MOCK_ACTIONS[0]) => {
  setSelectedAction(action)
  setGamePhase('dice')
}

// Update the render to show ActionPicker after scene loads
// Replace the placeholder text with:
{!isLoadingNarration && gamePhase === 'scene' && (
  <Button
    className="w-full"
    onClick={() => setGamePhase('action')}
  >
    Choose Action
  </Button>
)}

{gamePhase === 'action' && (
  <ActionPicker
    options={MOCK_ACTIONS}
    onSelect={handleActionSelect}
  />
)}
```

- [ ] **Step 3: Verify action picker**

Navigate to /play, click "Choose Action"
Expected: See 3 action options with stat icons

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add action picker component with stat indicators"
```

---

### Task 15: Dice Roller Component

**Files:**
- Create: `src/components/game/dice-roller.tsx`
- Create: `tests/components/game/dice-roller.test.tsx`
- Modify: `src/app/play/page.tsx`

- [ ] **Step 1: Create DiceRoller component**

```typescript
// src/components/game/dice-roller.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Stat } from '@/types/game'

const statEmoji: Record<Stat, string> = {
  strength: '💪',
  magic: '✨',
  agility: '🏃',
  heart: '❤️',
}

interface DiceRollerProps {
  stat: Stat
  dicePreference: 'physical' | 'digital'
  onRoll: (result: number) => void
}

export function DiceRoller({ stat, dicePreference, onRoll }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [physicalInput, setPhysicalInput] = useState('')

  const handleDigitalRoll = () => {
    setIsRolling(true)

    // Animate through numbers
    let count = 0
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 10) {
        clearInterval(interval)
        const finalResult = Math.floor(Math.random() * 6) + 1
        setResult(finalResult)
        setIsRolling(false)
        setTimeout(() => onRoll(finalResult), 500)
      }
    }, 100)
  }

  const [inputError, setInputError] = useState('')

  const handlePhysicalSubmit = () => {
    const value = parseInt(physicalInput)
    if (isNaN(value) || value < 1 || value > 6) {
      setInputError('Please enter 1-6')
      return
    }
    setInputError('')
    setResult(value)
    onRoll(value)
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          This tests your {statEmoji[stat]} {stat.charAt(0).toUpperCase() + stat.slice(1)}
        </p>
        <p className="text-lg font-medium">
          Roll and see what happens!
        </p>
      </div>

      <div className="flex justify-center">
        <div className={cn(
          "w-24 h-24 rounded-xl bg-muted flex items-center justify-center",
          "text-5xl font-bold text-foreground",
          isRolling && "animate-bounce"
        )}>
          {result ?? '?'}
        </div>
      </div>

      {dicePreference === 'digital' ? (
        <Button
          className="w-full"
          size="lg"
          onClick={handleDigitalRoll}
          disabled={isRolling || result !== null}
        >
          {isRolling ? 'Rolling...' : result ? 'Rolled!' : '🎲 Tap to Roll'}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Roll your physical d6 and enter the result:
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="6"
              value={physicalInput}
              onChange={(e) => setPhysicalInput(e.target.value)}
              placeholder="1-6"
              className="text-center text-xl"
            />
            <Button onClick={handlePhysicalSubmit}>
              Submit
            </Button>
          </div>
          {inputError && (
            <p className="text-sm text-destructive text-center">{inputError}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Integrate DiceRoller into Play page**

Add imports and handler:

```typescript
// Add import
import { DiceRoller } from '@/components/game/dice-roller'

// Add state
const [diceResult, setDiceResult] = useState<number | null>(null)

// Get dice preference from store
const { dicePreference } = useGameStore()

// Add handler
const handleDiceRoll = (result: number) => {
  setDiceResult(result)
  setGamePhase('outcome')
}

// Add to render (after action picker):
{gamePhase === 'dice' && selectedAction && (
  <DiceRoller
    stat={selectedAction.stat}
    dicePreference={dicePreference}
    onRoll={handleDiceRoll}
  />
)}
```

- [ ] **Step 3: Verify dice roller**

Navigate to /play, select action
Expected: See dice roller with stat indicator, can roll (digital) or enter (physical)

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add dice roller component with digital/physical modes"
```

---

### Task 16: Outcome Display Component

**Files:**
- Create: `src/components/game/outcome-display.tsx`
- Modify: `src/app/play/page.tsx`

- [ ] **Step 1: Create OutcomeDisplay component**

```typescript
// src/components/game/outcome-display.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OutcomeType } from '@/types/game'

interface OutcomeDisplayProps {
  outcome: OutcomeType
  diceRoll: number
  narrative: string
  isLoading: boolean
  onContinue: () => void
}

const outcomeStyles: Record<OutcomeType, {
  title: string
  emoji: string
  bgClass: string
  textClass: string
}> = {
  success: {
    title: 'Success!',
    emoji: '🎉',
    bgClass: 'bg-success/10 border-success/30',
    textClass: 'text-success',
  },
  partial: {
    title: 'Partial Success',
    emoji: '⚡',
    bgClass: 'bg-primary/10 border-primary/30',
    textClass: 'text-primary',
  },
  failure: {
    title: 'Plot Twist!',
    emoji: '🔄',
    bgClass: 'bg-secondary/10 border-secondary/30',
    textClass: 'text-secondary',
  },
}

export function OutcomeDisplay({
  outcome,
  diceRoll,
  narrative,
  isLoading,
  onContinue
}: OutcomeDisplayProps) {
  const style = outcomeStyles[outcome]

  return (
    <div className={cn(
      "rounded-lg p-6 border-2 space-y-4",
      style.bgClass
    )}>
      <div className="text-center space-y-2">
        <span className="text-4xl">{style.emoji}</span>
        <h3 className={cn("text-2xl font-serif", style.textClass)}>
          {style.title}
        </h3>
        <p className="text-muted-foreground">
          You rolled a <span className="font-bold text-foreground">{diceRoll}</span>
        </p>
      </div>

      <div className="bg-card rounded-lg p-4">
        {isLoading ? (
          <p className="text-muted-foreground animate-pulse">
            The story unfolds...
          </p>
        ) : (
          <p className="text-foreground leading-relaxed">{narrative}</p>
        )}
      </div>

      {!isLoading && (
        <Button className="w-full" size="lg" onClick={onContinue}>
          Continue Adventure →
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Integrate OutcomeDisplay into Play page**

Add imports and logic:

```typescript
// Add import
import { OutcomeDisplay } from '@/components/game/outcome-display'
import { calculateOutcome } from '@/lib/game/mechanics'
import { getClassStats } from '@/lib/game/classes'

// Add state
const [outcome, setOutcome] = useState<ReturnType<typeof calculateOutcome> | null>(null)
const [outcomeNarrative, setOutcomeNarrative] = useState('')
const [isLoadingOutcome, setIsLoadingOutcome] = useState(false)

// Update handleDiceRoll
const handleDiceRoll = (result: number) => {
  setDiceResult(result)

  if (selectedAction && currentCharacter) {
    const stats = getClassStats(currentCharacter.class)
    const calculatedOutcome = calculateOutcome({
      sceneFit: 'okay', // Will come from AI later
      statValue: stats[selectedAction.stat],
      diceRoll: result,
      difficulty,
    })
    setOutcome(calculatedOutcome)
    setIsLoadingOutcome(true)

    // Simulate outcome narrative loading
    setTimeout(() => {
      const narratives = {
        success: "Your action succeeds brilliantly! The way forward becomes clear.",
        partial: "It works, but not quite as planned. Something unexpected happens...",
        failure: "That didn't work, but you notice something else interesting!",
      }
      setOutcomeNarrative(narratives[calculatedOutcome.outcome])
      setIsLoadingOutcome(false)
    }, 1500)
  }

  setGamePhase('outcome')
}

// Add handler for continue
const handleContinue = () => {
  // Reset for next turn
  setGamePhase('scene')
  setSelectedAction(null)
  setDiceResult(null)
  setOutcome(null)
  setOutcomeNarrative('')

  // Rotate to next player
  setCurrentPlayerIndex(prev =>
    (prev + 1) % selectedPlayers.length
  )
}

// Add to render:
{gamePhase === 'outcome' && outcome && diceResult && (
  <OutcomeDisplay
    outcome={outcome.outcome}
    diceRoll={diceResult}
    narrative={outcomeNarrative}
    isLoading={isLoadingOutcome}
    onContinue={handleContinue}
  />
)}
```

- [ ] **Step 3: Verify full game loop**

Navigate through complete flow
Expected: Scene → Action → Dice → Outcome → Back to Scene with next player

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add outcome display and complete game loop"
```

---

## Phase 4: AI Integration

### Task 17: Gemini API Client Setup

> **Note:** `@google/generative-ai` was installed in Task 1. API keys are already configured in `.env.local`. Use `responseMimeType: 'application/json'` for structured output instead of fragile regex extraction. Image and TTS models have tight rate limits (1 RPM) — cache results and avoid unnecessary regeneration.

**Files:**
- Create: `src/lib/ai/gemini.ts`

- [ ] **Step 1: Verify environment variables**

Check that `.env.local` contains:
```bash
GOOGLE_AI_API_KEY=your-api-key-here
```

- [ ] **Step 2: Create Gemini client**

```typescript
// src/lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Text generation — Gemini 3 Flash (19 RPM / 20K)
const textModel = genAI.getGenerativeModel({ model: 'gemini-3-flash' })

// Structured JSON output — same model with JSON response format
const jsonModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})

// Image generation — Nano Banana 2 / Gemini 3.1 Flash Image (1 RPM / 5K)
const imageModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image' })

// TTS — Gemini 2.5 Flash TTS (1 RPM / 1K)
const ttsModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-tts' })

export async function generateText(prompt: string): Promise<string> {
  const result = await textModel.generateContent(prompt)
  const response = result.response
  return response.text()
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await jsonModel.generateContent(prompt)
  const response = result.response
  return JSON.parse(response.text())
}

// Note: Image and TTS generation functions will be added in later tasks.
// Both have 1 RPM rate limits — callers must handle rate limiting gracefully.
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Gemini API client setup"
```

---

### Task 18: Story & Action Generation

**Files:**
- Create: `src/lib/ai/story.ts`
- Create: `src/lib/ai/actions.ts`
- Create: `src/types/ai.ts`

- [ ] **Step 1: Create AI types**

```typescript
// src/types/ai.ts
import type { Stat, SceneFit, AdventureStyle, CharacterClass } from './game'

export interface GeneratedScene {
  narration: string
  imagePrompt: string
  suggestedNextPlayer: string // player ID
}

export interface GeneratedAction {
  id: string
  text: string
  stat: Stat
  sceneFit: SceneFit
  sceneFitReason: string
}

export interface GeneratedOutcome {
  narrative: string
}

export interface StoryContext {
  adventureStyle: AdventureStyle
  storyHistory: string[]
  characters: Array<{
    playerId: string
    playerName: string
    characterName: string
    class: CharacterClass
  }>
  currentPlayerId: string
}
```

- [ ] **Step 2: Create story generation**

```typescript
// src/lib/ai/story.ts
import { generateJSON } from './gemini'
import type { GeneratedScene, StoryContext } from '@/types/ai'

const STYLE_PROMPTS = {
  whimsical: "Keep the tone gentle and child-friendly for ages 4-7. No scary moments. Problems are solved with creativity and kindness. Use bright, cheerful imagery.",
  realistic: "Create exciting adventure with mild tension for ages 7-12. Heroes face real challenges but always prevail. Dynamic and engaging but not frightening.",
  dark: "Include complex themes and real consequences for ages 13+. Atmosphere can be moody and mysterious. Appropriate tension and stakes.",
}

export async function generateScene(context: StoryContext): Promise<GeneratedScene> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)

  const prompt = `You are a D&D dungeon master creating an interactive story for a family.

Adventure Style: ${context.adventureStyle}
${STYLE_PROMPTS[context.adventureStyle]}

Current Characters:
${context.characters.map(c => `- ${c.characterName} the ${c.class} (played by ${c.playerName})`).join('\n')}

Story So Far:
${context.storyHistory.slice(-5).join('\n') || 'The adventure is just beginning.'}

Current Player: ${currentCharacter?.playerName} as ${currentCharacter?.characterName}

Generate the next scene. Return JSON:
{
  "narration": "2-3 sentences describing the scene, what the characters see and hear",
  "imagePrompt": "A detailed prompt for generating an image of this scene",
  "suggestedNextPlayer": "the player ID of whichever character would most naturally act next based on the story context"
}

Choose suggestedNextPlayer based on the narrative — who would be most relevant to act in this scene?
Available player IDs: ${context.characters.map(c => c.playerId).join(', ')}

Make the narration engaging and end with a moment that calls for action.`

  return generateJSON<GeneratedScene>(prompt)
}
```

- [ ] **Step 3: Create action generation**

```typescript
// src/lib/ai/actions.ts
import { generateJSON } from './gemini'
import type { GeneratedAction, StoryContext } from '@/types/ai'
import type { CharacterClass } from '@/types/game'

export async function generateActions(
  context: StoryContext,
  currentScene: string
): Promise<GeneratedAction[]> {
  const currentCharacter = context.characters.find(c => c.playerId === context.currentPlayerId)

  const prompt = `You are a D&D dungeon master creating action options.

Current Scene: ${currentScene}

Current Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}

Generate exactly 3 action options the player could take. Each should:
- Use a different stat when possible (strength, magic, agility, heart)
- Include at least one non-combat option
- Be clear enough for a child to understand
- Have a "sceneFit" rating based on how smart the choice is for THIS situation (independent of character stats)

Return JSON array:
[
  {
    "id": "1",
    "text": "Action description in first person (I will...)",
    "stat": "strength|magic|agility|heart",
    "sceneFit": "good|okay|risky",
    "sceneFitReason": "Why this is or isn't a smart choice for this scene"
  }
]

One option should be "good" (smart for this scene), one "okay", one "risky".`

  return generateJSON<GeneratedAction[]>(prompt)
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add AI story and action generation"
```

---

### Task 19: Outcome Generation

**Files:**
- Create: `src/lib/ai/outcomes.ts`

- [ ] **Step 1: Create outcome generation**

```typescript
// src/lib/ai/outcomes.ts
import { generateText } from './gemini'
import type { StoryContext } from '@/types/ai'
import type { OutcomeType, Stat } from '@/types/game'

interface OutcomeContext {
  storyContext: StoryContext
  actionChosen: string
  stat: Stat
  outcome: OutcomeType
  currentScene: string
}

const OUTCOME_INSTRUCTIONS = {
  success: "The action succeeds. Describe how it works well and advances the story positively.",
  partial: "The action partially succeeds. It works but there's a complication or unexpected cost.",
  failure: "The action doesn't work as intended. But something interesting is revealed or a new opportunity appears. This is a plot twist, not a punishment.",
}

export async function generateOutcome(context: OutcomeContext): Promise<string> {
  const currentCharacter = context.storyContext.characters.find(
    c => c.playerId === context.storyContext.currentPlayerId
  )

  const prompt = `You are a D&D dungeon master narrating an outcome.

Adventure Style: ${context.storyContext.adventureStyle}
Current Scene: ${context.currentScene}
Character: ${currentCharacter?.characterName} the ${currentCharacter?.class}
Action Attempted: ${context.actionChosen}
Stat Used: ${context.stat}
Result: ${context.outcome.toUpperCase()}

${OUTCOME_INSTRUCTIONS[context.outcome]}

Write 2-3 sentences describing what happens. Be vivid and engaging. Don't include dice numbers or game mechanics - just tell the story.`

  return generateText(prompt)
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI outcome generation"
```

---

### Task 19b: Image Generation

> **Note:** Nano Banana 2 (Gemini 3.1 Flash Image) has a 1 RPM rate limit. Cache images per scene to avoid re-generation. Generate once per scene, reuse across turns within the same scene.

**Files:**
- Create: `src/lib/ai/images.ts`

- [ ] **Step 1: Create image generation module**

```typescript
// src/lib/ai/images.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AdventureStyle } from '@/types/game'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const imageModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image' })

const STYLE_PREFIXES: Record<AdventureStyle, string> = {
  whimsical: 'Bright, colorful storybook illustration style. Friendly, rounded shapes. Warm lighting.',
  realistic: 'Detailed fantasy art, dynamic composition. Exciting but not scary. Think Pixar/DreamWorks.',
  dark: 'Atmospheric fantasy art. Moody lighting, rich shadows. Mature aesthetic.',
}

// In-memory cache to avoid re-generation within the same session
const imageCache = new Map<string, string>()

export async function generateSceneImage(
  sceneDescription: string,
  style: AdventureStyle
): Promise<string | null> {
  // Check cache first
  const cacheKey = `${style}:${sceneDescription.slice(0, 100)}`
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!
  }

  try {
    const prompt = `${STYLE_PREFIXES[style]} Scene: ${sceneDescription}. No text or UI elements in the image.`
    const result = await imageModel.generateContent(prompt)
    const response = result.response

    // Extract base64 image data from response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    )

    if (imagePart?.inlineData) {
      const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      imageCache.set(cacheKey, dataUrl)
      return dataUrl
    }

    return null
  } catch (error) {
    console.error('Image generation error:', error)
    return null // Graceful degradation — gameplay continues without image
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add scene image generation with caching"
```

---

### Task 19c: TTS Narration

> **Note:** Gemini 2.5 Flash TTS has a 1 RPM rate limit. Audio is generated on-demand only when the user taps the play button, not automatically.

**Files:**
- Create: `src/lib/ai/tts.ts`

- [ ] **Step 1: Create TTS module**

```typescript
// src/lib/ai/tts.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const ttsModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-tts' })

// In-memory cache to avoid re-generation
const audioCache = new Map<string, string>()

export async function generateNarration(text: string): Promise<string | null> {
  // Check cache first
  const cacheKey = text.slice(0, 100)
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!
  }

  try {
    const result = await ttsModel.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
    })
    const response = result.response

    // Extract audio data from response
    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
    )

    if (audioPart?.inlineData) {
      const dataUrl = `data:${audioPart.inlineData.mimeType};base64,${audioPart.inlineData.data}`
      audioCache.set(cacheKey, dataUrl)
      return dataUrl
    }

    return null
  } catch (error) {
    console.error('TTS generation error:', error)
    return null // Graceful degradation — user reads text instead
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add TTS narration generation with caching"
```

---

### Task 20: API Routes for AI

**Files:**
- Create: `src/app/api/ai/scene/route.ts`
- Create: `src/app/api/ai/actions/route.ts`
- Create: `src/app/api/ai/outcome/route.ts`
- Create: `src/app/api/ai/image/route.ts`
- Create: `src/app/api/ai/tts/route.ts`

- [ ] **Step 1: Create scene API route**

```typescript
// src/app/api/ai/scene/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateScene } from '@/lib/ai/story'
import type { StoryContext } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const context: StoryContext = await request.json()
    const scene = await generateScene(context)
    return NextResponse.json(scene)
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Create actions API route**

```typescript
// src/app/api/ai/actions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateActions } from '@/lib/ai/actions'
import type { StoryContext } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const { context, currentScene }: { context: StoryContext; currentScene: string } = await request.json()
    const actions = await generateActions(context, currentScene)
    return NextResponse.json(actions)
  } catch (error) {
    console.error('Actions generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate actions' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Create outcome API route**

```typescript
// src/app/api/ai/outcome/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateOutcome } from '@/lib/ai/outcomes'

export async function POST(request: NextRequest) {
  try {
    const context = await request.json()
    const narrative = await generateOutcome(context)
    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('Outcome generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate outcome' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Create image API route**

```typescript
// src/app/api/ai/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateSceneImage } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, style }: { sceneDescription: string; style: AdventureStyle } = await request.json()
    const imageUrl = await generateSceneImage(sceneDescription, style)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image', imageUrl: null },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 5: Create TTS API route**

```typescript
// src/app/api/ai/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateNarration } from '@/lib/ai/tts'

export async function POST(request: NextRequest) {
  try {
    const { text }: { text: string } = await request.json()
    const audioUrl = await generateNarration(text)
    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error('TTS generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio', audioUrl: null },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add API routes for AI generation (text, images, TTS)"
```

---

### Task 21: Integrate AI into Game Loop

**Files:**
- Modify: `src/app/play/page.tsx`
- Create: `src/hooks/use-game-ai.ts`

- [ ] **Step 1: Create useGameAI hook**

```typescript
// src/hooks/use-game-ai.ts
'use client'

import { useState, useCallback } from 'react'
import type { StoryContext, GeneratedScene, GeneratedAction } from '@/types/ai'
import type { OutcomeType, Stat } from '@/types/game'

export function useGameAI() {
  // Per-operation loading states to avoid race conditions
  const [loadingScene, setLoadingScene] = useState(false)
  const [loadingActions, setLoadingActions] = useState(false)
  const [loadingOutcome, setLoadingOutcome] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateScene = useCallback(async (context: StoryContext): Promise<GeneratedScene | null> => {
    setLoadingScene(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      if (!response.ok) throw new Error('Failed to generate scene')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingScene(false)
    }
  }, [])

  const generateActions = useCallback(async (
    context: StoryContext,
    currentScene: string
  ): Promise<GeneratedAction[] | null> => {
    setLoadingActions(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, currentScene }),
      })
      if (!response.ok) throw new Error('Failed to generate actions')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingActions(false)
    }
  }, [])

  const generateOutcome = useCallback(async (
    storyContext: StoryContext,
    actionChosen: string,
    stat: Stat,
    outcome: OutcomeType,
    currentScene: string
  ): Promise<string | null> => {
    setLoadingOutcome(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContext,
          actionChosen,
          stat,
          outcome,
          currentScene,
        }),
      })
      if (!response.ok) throw new Error('Failed to generate outcome')
      const data = await response.json()
      return data.narrative
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingOutcome(false)
    }
  }, [])

  // Generate scene image (1 RPM rate limit — fire and forget, don't block gameplay)
  const generateImage = useCallback(async (
    sceneDescription: string,
    style: string
  ): Promise<string | null> => {
    setLoadingImage(true)
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneDescription, style }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.imageUrl
    } catch {
      return null // Graceful degradation
    } finally {
      setLoadingImage(false)
    }
  }, [])

  return {
    loadingScene,
    loadingActions,
    loadingOutcome,
    loadingImage,
    error,
    generateScene,
    generateImage,
    generateActions,
    generateOutcome,
  }
}
```

- [ ] **Step 2: Update Play page to use AI**

Replace mock data with AI calls in `src/app/play/page.tsx`:

```typescript
// Add imports
import { useGameAI } from '@/hooks/use-game-ai'
import { getNextPlayer } from '@/lib/game/rotation'
import type { GeneratedAction, StoryContext } from '@/types/ai'

// Add hook — note per-operation loading states
const {
  loadingScene, loadingActions, loadingOutcome, loadingImage,
  error, generateScene, generateActions, generateOutcome, generateImage
} = useGameAI()

// Use adventure state from Zustand store (persisted)
const {
  currentScene, storyHistory, turnHistory, currentPlayerIndex,
  updateAdventureState, adventureStyle, difficulty
} = useGameStore()

// Validate all selected players have characters (guard)
useEffect(() => {
  const missingCharacter = selectedPlayers.some(
    p => !characters.find(c => c.playerId === p.id)
  )
  if (missingCharacter || selectedPlayers.length === 0) {
    router.push('/characters')
  }
}, [selectedPlayers, characters, router])

// Build story context for AI calls
const buildStoryContext = useCallback((): StoryContext => ({
  adventureStyle,
  storyHistory,
  characters: selectedPlayers.map(p => {
    const char = characters.find(c => c.playerId === p.id)!
    return {
      playerId: p.id,
      playerName: p.name,
      characterName: char.name,
      class: char.class,
    }
  }),
  currentPlayerId: currentPlayer.id,
}), [adventureStyle, storyHistory, selectedPlayers, characters, currentPlayer])

// Track AI's suggested next player from scene response
const [aiSuggestedPlayerId, setAiSuggestedPlayerId] = useState<string>(currentPlayer?.id ?? '')

// Load scene with AI + fire-and-forget image generation
useEffect(() => {
  const loadScene = async () => {
    const context = buildStoryContext()
    const scene = await generateScene(context)
    if (scene) {
      updateAdventureState({
        currentScene: scene.narration,
        storyHistory: [...storyHistory, scene.narration],
      })
      setAiSuggestedPlayerId(scene.suggestedNextPlayer)
      // Fire-and-forget image generation (1 RPM — don't block gameplay)
      generateImage(scene.imagePrompt, adventureStyle)
    }
  }
  if (!currentScene) loadScene() // Only load if no scene (handles page refresh)
}, [currentPlayerIndex])

// Handle continue — use rotation.ts for player selection
const handleContinue = () => {
  const nextPlayer = getNextPlayer(
    selectedPlayers,
    turnHistory,
    aiSuggestedPlayerId
  )
  const nextIndex = selectedPlayers.findIndex(p => p.id === nextPlayer.id)

  updateAdventureState({
    currentPlayerIndex: nextIndex,
    currentScene: '', // Reset to trigger new scene load
  })
  setGamePhase('scene')
  setSelectedAction(null)
  setDiceResult(null)
  setOutcome(null)
}
```

- [ ] **Step 3: Add pause overlay**

Add a simple pause overlay accessible via a button in the top corner of the play page:

```typescript
// Inline in play page — simple overlay, not a separate component
const [isPaused, setIsPaused] = useState(false)

// In render, add pause button:
<button
  onClick={() => setIsPaused(true)}
  className="fixed top-4 right-4 p-2 rounded-lg bg-card border border-border"
>
  ⏸
</button>

{isPaused && (
  <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
    <div className="bg-card p-6 rounded-lg border border-border space-y-4 max-w-xs w-full">
      <h2 className="text-xl font-serif text-primary text-center">Paused</h2>
      <Button className="w-full" onClick={() => setIsPaused(false)}>
        Resume
      </Button>
      <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
        Save & Quit
      </Button>
    </div>
  </div>
)}
```

Game state auto-saves via Zustand persist, so "Save & Quit" just navigates home.

- [ ] **Step 4: Test with real AI**

Ensure GOOGLE_AI_API_KEY is set, run app
Expected: AI generates unique scenes, actions, and outcomes. Player rotation uses the rotation.ts logic. Pause overlay works. Page refresh restores game state.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: integrate AI generation, rotation, persistence, and pause menu"
```

---

## Phase 5: Polish & Deploy

### Task 22: Error Handling & Loading States

**Files:**
- Modify: `src/app/play/page.tsx`
- Create: `src/components/game/error-message.tsx`

- [ ] **Step 1: Create ErrorMessage component**

```typescript
// src/components/game/error-message.tsx
import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Add error handling to Play page**

Add error states and retry logic throughout the game loop.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add error handling and retry functionality"
```

---

### Task 23: PWA Setup

> **Note:** Next.js 16 supports `app/manifest.ts` for typed, programmatic manifest generation. `viewport` is already a separate export in our layout (set in Task 2). Do NOT put viewport inside the metadata object.

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)
- Modify: `src/app/layout.tsx` (add themeColor to metadata)

- [ ] **Step 1: Create app/manifest.ts**

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Family Quest',
    short_name: 'Family Quest',
    description: 'AI-powered D&D adventures for families',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e14',
    theme_color: '#f0a500',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

- [ ] **Step 2: Add themeColor to layout metadata**

```typescript
// Update src/app/layout.tsx — add to existing metadata export
export const metadata: Metadata = {
  title: "Family Quest",
  description: "AI-powered D&D adventures for families",
  // manifest is auto-discovered from app/manifest.ts
}
```

> **Reminder:** The `viewport` export was already added in Task 2. Do NOT duplicate it here.

- [ ] **Step 3: Create placeholder icons**

Create simple colored squares as placeholders (will be replaced with real icons).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add PWA manifest and icons"
```

---

### Task 24: Deploy to Vercel

**Files:**
- None (deployment configuration)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

Go to vercel.com, import the GitHub repo.

- [ ] **Step 3: Add environment variables**

In Vercel dashboard, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_AI_API_KEY`

- [ ] **Step 4: Deploy**

Vercel will auto-deploy on push.

- [ ] **Step 5: Verify production**

Test the deployed app at the Vercel URL.

- [ ] **Step 6: Commit any fixes**

```bash
git add .
git commit -m "chore: deployment configuration"
```

---

## Summary

This plan covers:
- **Phase 1:** Foundation (8 tasks) - Project setup, design system (Tailwind v4/oklch), Supabase, anonymous auth, game mechanics
- **Phase 2:** Onboarding (4 tasks) - Welcome, Players, Settings, Characters screens (adventure selection removed for MVP)
- **Phase 3:** Core Game Loop (4 tasks) - Scene, Actions, Dice, Outcome components
- **Phase 4:** AI Integration (7 tasks) - Gemini 3 Flash + Nano Banana 2 + Gemini 2.5 Flash TTS setup, story/action/outcome/image/TTS generation
- **Phase 5:** Polish & Deploy (3 tasks) - Error handling, PWA (app/manifest.ts), deployment

Total: **24 tasks** with approximately **110 bite-sized steps**

Each task produces a working, testable increment. Commits are frequent. Tests cover core game logic.

### Stack Compatibility Notes (Updated 2026-04-04)

| Concern | Resolution |
|---------|------------|
| **Tailwind v4** | CSS-based config via `@theme inline` in globals.css, oklch color format |
| **shadcn v4 (base-nova)** | Uses `@base-ui/react` not Radix. No `asChild` — use `render` prop for composition |
| **Next.js 16** | `viewport` is separate export, params are Promises, manifest via `app/manifest.ts` |
| **React 19** | `forwardRef` no longer needed (ref is a regular prop), `use()` hook available |
| **Gemini models** | Text: `gemini-3-flash` (19 RPM). Images: `gemini-3.1-flash-image` / Nano Banana 2 (1 RPM). TTS: `gemini-2.5-flash-tts` (1 RPM). Use `responseMimeType: 'application/json'` for structured output |
| **Zustand v5** | Compatible with plan's patterns (persist middleware unchanged) |
| **cn utility** | Already exists at `src/lib/utils.ts` — import from `@/lib/utils` |
