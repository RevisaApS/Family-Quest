'use client'

import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { useGameStore } from '@/stores/game-store'
import { playerHallStats, defeatedVillains } from '@/lib/game/chronicle'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import { t } from '@/lib/i18n'

// The Hall of Heroes: the family's permanent record — lifetime stats and
// awards per kid, every villain ever defeated, and the storybook of tales.
export default function HallPage() {
  const { chronicle, language, _hasHydrated } = useGameStore()

  if (!_hasHydrated) return null

  // Heroes are read from the chronicle itself, so kids removed from the
  // roster keep their place in history.
  const heroEntries = new Map<string, { playerName: string; characterName: string; class: keyof typeof CLASS_DEFINITIONS }>()
  for (const record of chronicle) {
    for (const hero of record.heroes) {
      heroEntries.set(hero.playerId, {
        playerName: hero.playerName,
        characterName: hero.characterName,
        class: hero.class,
      })
    }
  }
  const villains = defeatedVillains(chronicle)
  const tales = chronicle.filter(r => r.tale)

  return (
    <>
      <Header backHref="/" />
      <PageContainer>
        <div className="space-y-6 pt-12 pb-8">
          <div className="text-center space-y-1">
            <span className="text-5xl block">🏆</span>
            <h1 className="text-3xl font-serif text-primary">{t('hallTitle', language)}</h1>
          </div>

          {chronicle.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('hallEmpty', language)}</p>
          ) : (
            <>
              {/* Lifetime stats + awards per hero */}
              <div className="space-y-2">
                {[...heroEntries.entries()].map(([playerId, entry]) => {
                  const stats = playerHallStats(chronicle, playerId)
                  return (
                    <div key={playerId} className="rounded-lg border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{CLASS_DEFINITIONS[entry.class].emoji}</span>
                        <div className="min-w-0">
                          <p className="font-serif text-lg leading-tight truncate">{entry.characterName}</p>
                          <p className="text-xs text-muted-foreground truncate">{entry.playerName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1">
                          🗺️ {stats.adventures} {t('adventuresLabel', language)}
                        </span>
                        <span className="rounded-full bg-success/10 text-success px-2.5 py-1">
                          ⭐ {stats.crits} {t('critsLabel', language)}
                        </span>
                        <span className="rounded-full bg-secondary/10 text-secondary px-2.5 py-1">
                          🎯 {stats.successes} {t('successesLabel', language)}
                        </span>
                      </div>
                      {stats.awards.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {stats.awards.map((award, i) => (
                            <p key={i} className="text-sm">
                              🏅 <span className="font-medium">{award.title}</span>
                              <span className="text-xs text-muted-foreground"> · {award.questTitle}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bestiary of beaten villains */}
              {villains.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">👹 {t('villainsDefeated', language)}</h2>
                  {villains.map((v, i) => (
                    <div key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-3">
                      <span className="text-2xl">👹</span>
                      <div className="min-w-0">
                        <p className="font-serif truncate">{v.villain}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.questTitle} · {new Date(v.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="ml-auto text-success font-bold">✓</span>
                    </div>
                  ))}
                </div>
              )}

              {/* The storybook: every tale the storyteller has written */}
              {tales.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">📖 {t('storybook', language)}</h2>
                  {tales.map(record => (
                    <details key={record.id} className="rounded-lg border border-primary/30 bg-card p-3">
                      <summary className="font-serif text-primary cursor-pointer">
                        📖 {record.tale!.title}
                      </summary>
                      <p className="text-sm leading-relaxed mt-2">{record.tale!.story}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(record.completedAt).toLocaleDateString()}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </>
  )
}
