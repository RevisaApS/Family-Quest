'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { useGameStore } from '@/stores/game-store'
import { t } from '@/lib/i18n'

export default function WelcomePage() {
  const router = useRouter()
  const {
    savedAdventures, loadAdventure, deleteAdventure, startNewAdventure, _hasHydrated,
    chronicle, language,
  } = useGameStore()

  return (
    <>
      <Header />
      <PageContainer className="justify-center">
        <div className="relative text-center space-y-8">
          {/* Radial gold glow behind the title */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, oklch(0.78 0.165 75 / 0.6) 0%, transparent 70%)',
            }}
          />

          {/* Floating sparkle particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="sparkle sparkle-1" />
            <div className="sparkle sparkle-2" />
            <div className="sparkle sparkle-3" />
            <div className="sparkle sparkle-4" />
            <div className="sparkle sparkle-5" />
            <div className="sparkle sparkle-6" />
          </div>

          <div className="relative space-y-4">
            <motion.h1
              className="text-5xl font-serif text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              Family Quest
            </motion.h1>

            {/* Ornamental divider */}
            <motion.div
              className="flex items-center justify-center gap-3 py-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="block h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-primary/70 text-sm tracking-widest select-none">&#10022;</span>
              <span className="block h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </motion.div>

            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Embark on magical adventures together
            </motion.p>
          </div>

          <motion.div
            className="relative space-y-3 pt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
          >
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={() => {
                startNewAdventure()
                router.push('/players')
              }}
            >
              Begin Your Journey
            </Button>

            {_hasHydrated && chronicle.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => router.push('/hall')}
              >
                🏆 {t('hallTitle', language)}
              </Button>
            )}

            <p className="text-sm text-muted-foreground">
              Your story awaits
            </p>

            {_hasHydrated && savedAdventures.length > 0 && (
              <div className="space-y-2 pt-4 text-left">
                <p className="text-sm text-muted-foreground text-center">Or continue an adventure:</p>
                {savedAdventures.map((adventure) => (
                  <div
                    key={adventure.id}
                    className="flex items-center gap-2 bg-card/50 border border-border rounded-lg p-3"
                  >
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => {
                        loadAdventure(adventure.id)
                        router.push('/play')
                      }}
                    >
                      <span className="font-medium block truncate">📖 {adventure.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(adventure.savedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      aria-label={`Delete ${adventure.name}`}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        if (window.confirm(`Delete "${adventure.name}"? This cannot be undone.`)) {
                          deleteAdventure(adventure.id)
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </PageContainer>
    </>
  )
}
