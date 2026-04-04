import { describe, it, expect } from 'vitest'
import { getNextPlayer, canAIChoosePlayer } from '@/lib/game/rotation'

const players = [
  { id: 'p1', name: 'Luna' },
  { id: 'p2', name: 'Max' },
  { id: 'p3', name: 'Zoe' },
]

describe('canAIChoosePlayer', () => {
  it('should allow AI to choose if no player has waited 2 turns', () => {
    const turnHistory = [{ playerId: 'p1' }, { playerId: 'p2' }]
    expect(canAIChoosePlayer('p3', players, turnHistory as any)).toBe(true)
  })
  it('should force specific player if they waited 2 turns', () => {
    const turnHistory = [{ playerId: 'p2' }, { playerId: 'p3' }, { playerId: 'p2' }, { playerId: 'p3' }]
    expect(canAIChoosePlayer('p2', players, turnHistory as any)).toBe(false)
    expect(canAIChoosePlayer('p1', players, turnHistory as any)).toBe(true)
  })
})

describe('getNextPlayer', () => {
  it('should return forced player if someone waited too long', () => {
    const turnHistory = [{ playerId: 'p2' }, { playerId: 'p3' }, { playerId: 'p2' }, { playerId: 'p3' }]
    const result = getNextPlayer(players, turnHistory as any, 'p2')
    expect(result.id).toBe('p1')
  })
  it('should return AI preferred player if no one forced', () => {
    const turnHistory = [{ playerId: 'p1' }]
    const result = getNextPlayer(players, turnHistory as any, 'p2')
    expect(result.id).toBe('p2')
  })
})
