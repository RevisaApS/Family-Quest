'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  const { adventureStyle, difficulty, dicePreference, setSettings } = useGameStore()

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">Settings</h1>
            <p className="text-muted-foreground">Customize your adventure experience</p>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">Adventure Style</Label>
            <div className="space-y-2">
              {(['whimsical', 'realistic', 'dark'] as AdventureStyle[]).map((style) => (
                <StyleOption key={style} style={style} selected={adventureStyle === style} onSelect={() => setSettings({ adventureStyle: style })} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">Difficulty</Label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <DifficultyOption key={diff} difficulty={diff} selected={difficulty === diff} onSelect={() => setSettings({ difficulty: diff })} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">Dice</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ dicePreference: 'digital' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card",
                  dicePreference === 'digital' ? "border-primary ring-2 ring-primary/20" : "border-border"
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
                  dicePreference === 'physical' ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🎯</span>
                <span className="font-medium">Physical</span>
                <span className="text-xs text-muted-foreground block">Use real dice</span>
              </button>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={() => router.push('/characters')}>
            Continue to Characters
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
