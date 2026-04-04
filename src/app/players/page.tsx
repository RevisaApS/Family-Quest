'use client'

import { useState } from 'react'
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
  const { players, addPlayer, removePlayer, selectedPlayerIds, selectPlayer, deselectPlayer } = useGameStore()

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
    if (selectedPlayerIds.includes(id)) deselectPlayer(id)
    else if (selectedPlayerIds.length < 4) selectPlayer(id)
  }

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-primary">Who&apos;s Playing?</h1>
            <p className="text-muted-foreground">Select 1-4 adventurers for today&apos;s quest</p>
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
        </div>
      </PageContainer>
    </>
  )
}
