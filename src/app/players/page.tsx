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
import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'

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

export default function PlayersPage() {
  const router = useRouter()
  const { players, addPlayer, removePlayer, reorderPlayers, selectedPlayerIds, selectPlayer, deselectPlayer } = useGameStore()

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
            <h1 className="text-3xl font-serif text-primary">Who&apos;s Playing?</h1>
            <p className="text-muted-foreground">Select 1-4 adventurers for today&apos;s quest</p>
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
              {editMode ? 'Done Editing' : 'Edit Players'}
            </button>
          )}

          {isAdding ? (
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter player name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" min="1" max="18" value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder="Enter age" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPlayer} className="flex-1">Add Player</Button>
                {players.length > 0 && (
                  <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                )}
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
              + Add Another Player
            </Button>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={selectedPlayerIds.length < 1}
            onClick={() => router.push('/settings')}
          >
            Continue ({selectedPlayerIds.length} selected)
          </Button>
        </motion.div>
      </PageContainer>

      {playerToRemove && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border space-y-4 max-w-xs w-full">
            <h2 className="text-lg font-serif text-primary text-center">Remove Player?</h2>
            <p className="text-sm text-muted-foreground text-center">
              Remove {players.find(p => p.id === playerToRemove)?.name} from the adventuring party?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => { removePlayer(playerToRemove); setPlayerToRemove(null) }}
              >
                Remove
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPlayerToRemove(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
