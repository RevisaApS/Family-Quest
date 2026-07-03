import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateJSON = vi.fn().mockResolvedValue([])
const generateText = vi.fn().mockResolvedValue('')

vi.mock('@/lib/ai/gemini', () => ({
  generateJSON: (...args: unknown[]) => generateJSON(...args),
  generateText: (...args: unknown[]) => generateText(...args),
}))

import { generateScene } from '@/lib/ai/story'
import { generateActions } from '@/lib/ai/actions'
import { generateOutcome } from '@/lib/ai/outcomes'
import type { StoryContext } from '@/types/ai'

const baseContext: StoryContext = {
  adventureStyle: 'realistic',
  storyHistory: [],
  characters: [
    { playerId: 'p1', playerName: 'Twin A', characterName: 'Luna', class: 'wizard' },
  ],
  currentPlayerId: 'p1',
  language: 'da',
}

beforeEach(() => {
  generateJSON.mockClear()
  generateText.mockClear()
})

describe('Danish language instruction in prompts', () => {
  it('scene prompt instructs Danish output for ages 8-10', async () => {
    await generateScene(baseContext)
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toContain('Danish')
    expect(prompt).toMatch(/8[-–]10/)
  })

  it('actions prompt instructs Danish output and short action text', async () => {
    await generateActions(baseContext, 'A dark cave mouth yawns before you.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toContain('Danish')
    expect(prompt.toLowerCase()).toContain('short')
  })

  it('outcome prompt instructs Danish output', async () => {
    await generateOutcome({
      storyContext: baseContext,
      actionChosen: 'Jeg vil snige mig forbi.',
      stat: 'agility',
      outcome: 'success',
      currentScene: 'A dark cave.',
    })
    const prompt = generateText.mock.calls[0][0] as string
    expect(prompt).toContain('Danish')
  })

  it('English mode does not instruct Danish', async () => {
    await generateScene({ ...baseContext, language: 'en' })
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).not.toContain('Danish')
  })
})
