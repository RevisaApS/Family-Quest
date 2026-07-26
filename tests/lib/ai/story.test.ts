import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StoryContext } from '@/types/ai'

const generateJSON = vi.fn()
vi.mock('@/lib/ai/gemini', () => ({ generateJSON: (...args: unknown[]) => generateJSON(...args) }))

const { generateScene } = await import('@/lib/ai/story')

const CONTEXT: StoryContext = {
  adventureStyle: 'realistic',
  storyHistory: [],
  characters: [
    { playerId: 'p1', playerName: 'Lukas', characterName: 'Lukas', class: 'warrior' },
  ],
  currentPlayerId: 'p1',
  language: 'da',
  encounterPhase: 'none',
  encounter: null,
  quest: null,
  isFirstScene: true,
}

function promptFrom(call: number): string {
  return generateJSON.mock.calls[call][0] as string
}

describe('generateScene — opening variety', () => {
  beforeEach(() => {
    generateJSON.mockReset()
    generateJSON.mockResolvedValue({ narration: '', imagePrompt: '', suggestedNextPlayer: 'p1' })
  })

  it('asks a different question every time the adventure starts', async () => {
    // The bug: the opening prompt was byte-identical every adventure, so with
    // thinking off the model answered it the same way — same villain, same
    // village. Ten openings must not collapse to one or two prompts.
    for (let i = 0; i < 10; i++) await generateScene(CONTEXT)
    const prompts = new Set(generateJSON.mock.calls.map(c => c[0]))
    expect(prompts.size).toBeGreaterThan(7)
  })

  it('carries the drawn ingredients and the name ban into the prompt', async () => {
    await generateScene(CONTEXT)
    const prompt = promptFrom(0)
    expect(prompt).toContain("THIS ADVENTURE'S INGREDIENTS")
    expect(prompt).toContain('Malachor')
    expect(prompt).toContain("The villain's NAME must be")
  })

  it('bans villains the family already beat', async () => {
    await generateScene({
      ...CONTEXT,
      pastAdventures: [{ questTitle: 'Den Tabte Lygte', villain: 'Fru Tang' }],
    })
    expect(promptFrom(0)).toContain('Fru Tang')
  })

  it('runs scenes hotter than the default', async () => {
    await generateScene(CONTEXT)
    expect(generateJSON.mock.calls[0][2]).toBeGreaterThan(1)
  })

  it('leaves later scenes free of opening ingredients', async () => {
    await generateScene({
      ...CONTEXT,
      isFirstScene: false,
      quest: { title: 'Den Tabte Lygte', goal: 'Find lygten', villain: 'Fru Tang', milestonesDone: 1 },
    })
    const prompt = promptFrom(0)
    expect(prompt).not.toContain("THIS ADVENTURE'S INGREDIENTS")
    expect(prompt).toContain('Fru Tang')
  })
})
