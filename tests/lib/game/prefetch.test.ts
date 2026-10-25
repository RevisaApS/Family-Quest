import { describe, it, expect } from 'vitest'
import { turnSummaryLine, projectNextTurn, contextKey } from '@/lib/game/prefetch'
import type { StoryContext } from '@/types/ai'
import type { HeroState } from '@/types/game'

const hero = (over: Partial<HeroState> = {}): HeroState => ({
  playerId: 'p2', level: 2, xp: 6, hp: 0, maxHp: 7, knockedOut: true,
  gold: 3, skills: [], usedPowers: [], equipment: {}, potions: [], comeback: 0, assistUsed: false,
  ...over,
})

const ctx = (over: Partial<StoryContext> = {}): StoryContext => ({
  adventureStyle: 'fantasy',
  storyHistory: ['a', 'b'],
  characters: [{
    playerId: 'p1', playerName: 'Lucas', characterName: 'Lyn', class: 'ranger',
    rpg: { level: 2, hp: 5, maxHp: 7, knockedOut: false, skillNames: ['Ørneøje'], gearNames: ['bue'], petName: undefined },
  }],
  currentPlayerId: 'p1',
  language: 'da',
  encounterPhase: 'none',
  encounter: null,
  quest: { title: 'Q', goal: 'G', milestonesDone: 1 },
  isFirstScene: false,
  dilemma: false,
  ...over,
} as StoryContext)

describe('turnSummaryLine', () => {
  it('tags the outcome and keeps the prose', () => {
    expect(turnSummaryLine('Lyn', 'Skyd en pil', 'success', 'Pilen rammer.')).toBe('[Lyn · Skyd en pil · ✓] Pilen rammer.')
    expect(turnSummaryLine('Lyn', 'Skyd', 'partial', 'x')).toBe('[Lyn · Skyd · ~] x')
    expect(turnSummaryLine('Lyn', 'Skyd', 'failure', 'x')).toBe('[Lyn · Skyd · ✗] x')
  })
})

describe('projectNextTurn', () => {
  it('appends the line, caps history, advances the player and revives the next hero', () => {
    const out = projectNextTurn({
      storyHistory: Array.from({ length: 16 }, (_, i) => `l${i}`),
      pendingLine: 'new',
      maxHistory: 16,
      turnHistoryLength: 4,
      currentPlayerIndex: 0,
      playerIds: ['p1', 'p2', 'p3'],
      heroes: [hero({ playerId: 'p1', hp: 5, knockedOut: false }), hero()],
    })
    expect(out.storyHistory).toHaveLength(16)
    expect(out.storyHistory.at(-1)).toBe('new')
    expect(out.storyHistory[0]).toBe('l1')
    expect(out.turnHistoryLength).toBe(5)
    expect(out.currentPlayerIndex).toBe(1)
    expect(out.currentPlayerId).toBe('p2')
    const p2 = out.heroes.find(h => h.playerId === 'p2')!
    expect(p2.knockedOut).toBe(false)
    expect(p2.hp).toBeGreaterThan(0)
    expect(out.revivedPlayerId).toBe('p2')
  })

  it('wraps around and revives nobody when the next hero is standing', () => {
    const out = projectNextTurn({
      storyHistory: [], pendingLine: 'x', maxHistory: 16, turnHistoryLength: 0,
      currentPlayerIndex: 2, playerIds: ['p1', 'p2', 'p3'],
      heroes: [hero({ playerId: 'p1', hp: 4, knockedOut: false })],
    })
    expect(out.currentPlayerId).toBe('p1')
    expect(out.revivedPlayerId).toBeNull()
  })
})

describe('contextKey', () => {
  it('is equal for equal contexts', () => expect(contextKey(ctx())).toBe(contextKey(ctx())))

  it('changes with anything the scene or picture reads, gear included', () => {
    const a = ctx()
    const base = contextKey(a)
    const rpg = a.characters[0].rpg!
    const withRpg = (over: object) => ctx({ characters: [{ ...a.characters[0], rpg: { ...rpg, ...over } }] })
    expect(contextKey(ctx({ storyHistory: ['a', 'c'] }))).not.toBe(base)
    expect(contextKey(ctx({ currentPlayerId: 'p2' }))).not.toBe(base)
    expect(contextKey(ctx({ quest: { title: 'Q', goal: 'G', milestonesDone: 2 } }))).not.toBe(base)
    expect(contextKey(ctx({ encounterPhase: 'active' }))).not.toBe(base)
    expect(contextKey(withRpg({ hp: 4 }))).not.toBe(base)
    expect(contextKey(withRpg({ gearNames: ['sværd'] }))).not.toBe(base)
    expect(contextKey(withRpg({ skillNames: [] }))).not.toBe(base)
  })
})
