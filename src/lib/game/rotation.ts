import type { TurnRecord } from '@/types/game'

interface Player { id: string; name: string }

const MAX_WAIT_TURNS = 2

export function getTurnsSinceLastPlayed(playerId: string, turnHistory: TurnRecord[]): number {
  if (turnHistory.length === 0) return 0
  for (let i = turnHistory.length - 1; i >= 0; i--) {
    if (turnHistory[i].playerId === playerId) return turnHistory.length - 1 - i
  }
  return turnHistory.length
}

export function getPlayerWhoMustPlay(players: Player[], turnHistory: TurnRecord[]): Player | null {
  for (const player of players) {
    if (getTurnsSinceLastPlayed(player.id, turnHistory) >= MAX_WAIT_TURNS) return player
  }
  return null
}

export function canAIChoosePlayer(preferredPlayerId: string, players: Player[], turnHistory: TurnRecord[]): boolean {
  const forcedPlayer = getPlayerWhoMustPlay(players, turnHistory)
  if (!forcedPlayer) return true
  return forcedPlayer.id === preferredPlayerId
}

export function getNextPlayer(players: Player[], turnHistory: TurnRecord[], aiPreferredPlayerId: string): Player {
  const forcedPlayer = getPlayerWhoMustPlay(players, turnHistory)
  if (forcedPlayer) return forcedPlayer
  return players.find(p => p.id === aiPreferredPlayerId) || players[0]
}
