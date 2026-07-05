'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { StyleOption } from '@/components/onboarding/style-option'
import { DifficultyOption } from '@/components/onboarding/difficulty-option'
import { useGameStore } from '@/stores/game-store'
import { t } from '@/lib/i18n'
import type { AdventureStyle, Difficulty, DiceType } from '@/types/game'
import { cn } from '@/lib/utils'

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']

const steps = [
  { label: 'Players', href: '/players' },
  { label: 'Settings', href: '/settings' },
  { label: 'Characters', href: '/characters' },
]

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center mb-6">
    {steps.map((step, i) => (
      <div key={step.label} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "rounded-full transition-all",
              i < currentStep
                ? "w-3 h-3 bg-primary"
                : i === currentStep
                  ? "w-4 h-4 bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  : "w-3 h-3 bg-muted"
            )}
          />
          <span className={cn(
            "text-xs mt-1.5",
            i <= currentStep ? "text-primary" : "text-muted-foreground"
          )}>{step.label}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={cn(
            "w-16 h-0.5 mx-2 mb-5",
            i < currentStep ? "bg-primary" : "bg-muted"
          )} />
        )}
      </div>
    ))}
  </div>
)

export default function SettingsPage() {
  const router = useRouter()
  const { adventureStyle, difficulty, dicePreference, language, setSettings, diceInventory, setDiceInventory } = useGameStore()
  const [showInfo, setShowInfo] = useState(false)

  const adjustDice = (die: DiceType, delta: number) => {
    setDiceInventory({
      ...diceInventory,
      [die]: Math.max(0, Math.min(9, (diceInventory[die] ?? 0) + delta)),
    })
  }

  return (
    <>
      <Header backHref="/players" />
      <PageContainer>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">Settings</h1>
            <p className="text-muted-foreground">Customize your adventure experience</p>
            <button onClick={() => setShowInfo(!showInfo)} className="text-xs text-muted-foreground underline">
              {showInfo ? 'Hide guide' : 'ℹ️ What do these mean?'}
            </button>
            {showInfo && (
              <div className="text-xs text-muted-foreground space-y-2 bg-card/20 rounded-lg p-3 text-left">
                <p><strong>Adventure Style:</strong> Sets the tone - Whimsical for younger kids (4-7), Epic for cool monster-filled adventure (7-12), Dark for teens (13+)</p>
                <p><strong>Difficulty:</strong> Easy = gentle, Medium = balanced, Hard = real consequences</p>
                <p><strong>Dice:</strong> Digital = tap to roll in-app, Physical = use your own dice</p>
                <p><strong>Story Language:</strong> The language the adventure is told in</p>
              </div>
            )}
          </div>

          <StepIndicator currentStep={1} />

          <div className="bg-card/30 rounded-xl p-4 border border-border/50 space-y-3">
            <Label className="text-lg">Adventure Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['whimsical', 'realistic', 'dark'] as AdventureStyle[]).map((style) => (
                <StyleOption key={style} style={style} selected={adventureStyle === style} onSelect={() => setSettings({ adventureStyle: style })} />
              ))}
            </div>
          </div>

          <div className="bg-card/30 rounded-xl p-4 border border-border/50 space-y-3">
            <Label className="text-lg">Difficulty</Label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <DifficultyOption key={diff} difficulty={diff} selected={difficulty === diff} onSelect={() => setSettings({ difficulty: diff })} />
              ))}
            </div>
          </div>

          <div className="bg-card/30 rounded-xl p-4 border border-border/50 space-y-3">
            <Label className="text-lg">Dice</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ dicePreference: 'digital' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card text-center",
                  dicePreference === 'digital' ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🎲</span>
                <span className="font-medium">Digital</span>
              </button>
              <button
                onClick={() => setSettings({ dicePreference: 'physical' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card text-center",
                  dicePreference === 'physical' ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🎯</span>
                <span className="font-medium">Physical</span>
              </button>
            </div>

            {/* Which real dice are on the table? Rolls for dice you own use
                the tap-grid; anything missing rolls digitally. */}
            {dicePreference === 'physical' && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium">{t('yourDice', language)}</p>
                <div className="grid grid-cols-3 gap-2">
                  {DICE_TYPES.map(die => (
                    <div
                      key={die}
                      className={cn(
                        'rounded-lg border p-2 text-center space-y-1',
                        (diceInventory[die] ?? 0) > 0 ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      )}
                    >
                      <p className="text-sm font-bold">{die}</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjustDice(die, -1)}
                          className="w-7 h-7 rounded-md border border-border text-lg leading-none"
                          aria-label={`fewer ${die}`}
                        >
                          −
                        </button>
                        <span className="w-4 font-bold">{diceInventory[die] ?? 0}</span>
                        <button
                          onClick={() => adjustDice(die, 1)}
                          className="w-7 h-7 rounded-md border border-border text-lg leading-none"
                          aria-label={`more ${die}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t('diceNote', language)}</p>
              </div>
            )}
          </div>

          <div className="bg-card/30 rounded-xl p-4 border border-border/50 space-y-3">
            <Label className="text-lg">Story Language</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ language: 'da' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card text-center",
                  language === 'da' ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🇩🇰</span>
                <span className="font-medium">Dansk</span>
              </button>
              <button
                onClick={() => setSettings({ language: 'en' })}
                className={cn(
                  "flex-1 p-4 rounded-lg border-2 transition-all bg-card text-center",
                  language === 'en' ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <span className="text-2xl block mb-1">🇬🇧</span>
                <span className="font-medium">English</span>
              </button>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={() => router.push('/characters')}>
            Continue to Characters
          </Button>
        </motion.div>
      </PageContainer>
    </>
  )
}
