'use client'

import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { useGameStore } from '@/stores/game-store'
import { t } from '@/lib/i18n'
import { VALUE_THEMES, nextTheme, themeById } from '@/lib/game/values'
import { cn } from '@/lib/utils'

// The grown-up's corner. Deliberately NOT linked from anywhere in the app:
// /settings is step 2 of the onboarding the kids walk through, and the whole
// point of the values layer is that they never meet it as a system. Reach this
// by typing the address or from a bookmark, while the iPad is still yours.
export default function GrownUpPage() {
  const { quest, language, themeRotation, themeOverride, setThemeOverride } = useGameStore()

  const activeTheme = themeById(quest?.theme)
  const upcomingTheme = nextTheme(themeRotation, themeOverride)

  return (
    <>
      <Header backHref="/" />
      <PageContainer>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">{t('grownUpTitle', language)}</h1>
            <p className="text-muted-foreground text-sm">{t('grownUpSub', language)}</p>
          </div>

          <div className="bg-card/20 rounded-xl p-4 border border-border/40 space-y-3 text-left">
            <Label className="text-sm">{t('themeLabel', language)}</Label>

            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t('themeCurrentLabel', language)}:</span>{' '}
              {activeTheme ? activeTheme[language] : t('themeNotChosenYet', language)}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t('themeNextLabel', language)}:</span>{' '}
              {upcomingTheme[language]}
            </p>

            <div className="space-y-1.5">
              <button
                onClick={() => setThemeOverride(null)}
                className={cn(
                  'w-full rounded-lg border p-2 text-left text-xs transition-colors',
                  themeOverride === null ? 'border-primary bg-primary/10' : 'border-border bg-card'
                )}
              >
                {t('themeAuto', language)}
              </button>
              {VALUE_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setThemeOverride(theme.id)}
                  className={cn(
                    'w-full rounded-lg border p-2 text-left text-xs transition-colors',
                    themeOverride === theme.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  )}
                >
                  {theme[language]}
                </button>
              ))}
            </div>

            <p className="text-[0.7rem] text-muted-foreground italic">{t('themeNote', language)}</p>
          </div>
        </motion.div>
      </PageContainer>
    </>
  )
}
