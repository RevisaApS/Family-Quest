'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'
import { PlayerCard } from '@/components/onboarding/player-card'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { t } from '@/lib/i18n'
import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'

export default function PlayersPage() {
  const router = useRouter()
  const { players, addPlayer, removePlayer, reorderPlayers, selectedPlayerIds, selectPlayer, deselectPlayer, language } = useGameStore()

  const [isAdding, setIsAdding] = useState(players.length === 0)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState('')
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  const handleAddPlayer = () => {
    if (newName && newAge) {
      const prevIds = new Set(players.map(p => p.id))
      addPlayer({
        name: newName,
        age: parseInt(newAge),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })
      // Auto-select the newly added player
      const newPlayer = useGameStore.getState().players.find(p => !prevIds.has(p.id))
      if (newPlayer && selectedPlayerIds.length < 4) selectPlayer(newPlayer.id)
      setNewName('')
      setNewAge('')
      setIsAdding(false)
    }
  }

  const togglePlayerSelection = (id: string) => {
    if (selectedPlayerIds.includes(id)) deselectPlayer(id)
    else if (selectedPlayerIds.length < 4) selectPlayer(id)
  }

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
            <h1 className="text-3xl font-serif text-primary">{t('whosPlaying', language)}</h1>
            <p className="text-muted-foreground">{t('selectAdventurers', language)}</p>
          </div>

          <StepIndicator currentStep={0} />

          <div className="space-y-3">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id}
                {...player}
                selectable
                selected={selectedPlayerIds.includes(player.id)}
                onSelect={() => togglePlayerSelection(player.id)}
                onRemove={() => setPlayerToRemove(player.id)}
                editMode={editMode}
                onMoveUp={index > 0 ? () => reorderPlayers(index, index - 1) : undefined}
                onMoveDown={index < players.length - 1 ? () => reorderPlayers(index, index + 1) : undefined}
              />
            ))}
          </div>

          {players.length > 0 && (
            <button
              type="button"
              className={cn(
                "w-full text-sm transition-colors",
                editMode ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? t('doneEditing', language) : t('editPlayers', language)}
            </button>
          )}

          {isAdding ? (
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel', language)}</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('enterPlayerName', language)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">{t('ageLabel', language)}</Label>
                <Input id="age" type="number" min="1" max="18" value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder={t('enterAge', language)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPlayer} className="flex-1">{t('addPlayer', language)}</Button>
                {players.length > 0 && (
                  <Button variant="outline" onClick={() => setIsAdding(false)}>{t('cancel', language)}</Button>
                )}
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
              {t('addAnotherPlayer', language)}
            </Button>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={selectedPlayerIds.length < 1}
            onClick={() => router.push('/settings')}
          >
            {t('continueWord', language)} ({selectedPlayerIds.length} {t('selectedWord', language)})
          </Button>
        </motion.div>
      </PageContainer>

      {playerToRemove && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border space-y-4 max-w-xs w-full">
            <h2 className="text-lg font-serif text-primary text-center">{t('removePlayerTitle', language)}</h2>
            <p className="text-sm text-muted-foreground text-center">
              {t('removeWord', language)} {players.find(p => p.id === playerToRemove)?.name} {t('removeFromParty', language)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => { removePlayer(playerToRemove); setPlayerToRemove(null) }}
              >
                {t('removeWord', language)}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPlayerToRemove(null)}>
                {t('cancel', language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
