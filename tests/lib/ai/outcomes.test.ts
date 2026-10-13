import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StoryContext } from '@/types/ai'

const generateText = vi.fn()
vi.mock('@/lib/ai/gemini', () => ({ generateText: (...args: unknown[]) => generateText(...args) }))

const { generateOutcome } = await import('@/lib/ai/outcomes')

const CONTEXT: StoryContext = {
  adventureStyle: 'realistic',
  storyHistory: [],
  characters: [
    { playerId: 'p-steven', playerName: 'Steven', characterName: 'Aldor', class: 'warrior' },
    { playerId: 'p-lucas', playerName: 'Lucas', characterName: 'Ravn', class: 'rogue' },
  ],
  currentPlayerId: 'p-lucas',
  language: 'da',
  encounterPhase: 'none',
}

const prompt = () => generateText.mock.calls[0][0] as string

describe('generateOutcome: the knock-out and the rescue', () => {
  beforeEach(() => {
    generateText.mockReset()
    generateText.mockResolvedValue('Noget sker.')
  })

  it('tells the blow that takes the last heart as a gentle, comic knock-out', async () => {
    await generateOutcome({
      storyContext: { ...CONTEXT, currentPlayerId: 'p-steven' },
      actionChosen: 'Jeg løber mod trolden',
      stat: 'strength',
      outcome: 'failure',
      currentScene: 'En trold spærrer broen.',
      damageTaken: 3,
      knockedOut: true,
    })
    expect(prompt()).toContain('THIS BLOW KNOCKS Aldor OUT')
    expect(prompt()).toMatch(/never scary/)
    expect(prompt()).toMatch(/seeing stars/)
    expect(prompt()).toMatch(/friends can help them back up/)
  })

  it('says nothing about a knock-out on an ordinary turn', async () => {
    await generateOutcome({
      storyContext: CONTEXT,
      actionChosen: 'Jeg sniger mig forbi',
      stat: 'agility',
      outcome: 'failure',
      currentScene: 'En trold spærrer broen.',
      damageTaken: 2,
    })
    expect(prompt()).not.toMatch(/KNOCKS/)
    expect(prompt()).not.toMatch(/RESCUE/)
  })

  it('tells a rescue as the helper getting the friend up, never as a plot twist', async () => {
    await generateOutcome({
      storyContext: CONTEXT,
      actionChosen: 'Hjælp Aldor op',
      stat: 'heart',
      outcome: 'failure',
      currentScene: 'Aldor sidder svimmel på broen.',
      rescueTargetName: 'Aldor',
    })
    expect(prompt()).toContain('THIS TURN IS A RESCUE: Ravn spends the turn helping their friend Aldor')
    expect(prompt()).toMatch(/still end up on their feet/)
    // The usual failure line would tell the wrong story: the rescue always works
    expect(prompt()).not.toMatch(/plot twist, not a punishment/)
  })

  it('a rescue does not answer the chapter dilemma', async () => {
    await generateOutcome({
      storyContext: { ...CONTEXT, dilemma: true },
      actionChosen: 'Hjælp Aldor op',
      stat: 'heart',
      outcome: 'success',
      currentScene: 'Guldet glimter, og Aldor sidder svimmel på broen.',
      rescueTargetName: 'Aldor',
    })
    expect(prompt()).not.toMatch(/ANSWERED THE SCENE'S CHOICE/)
  })
})

describe('generateOutcome: gear the hero actually carries', () => {
  beforeEach(() => {
    generateText.mockReset()
    generateText.mockResolvedValue('Noget sker.')
  })

  const withGear = (gearNames: string[]): StoryContext => ({
    ...CONTEXT,
    characters: [{
      ...CONTEXT.characters[1],
      rpg: { level: 1, hp: 6, maxHp: 6, knockedOut: false, skillNames: [], gearNames },
    }],
  })
  const outcome = (storyContext: StoryContext) => generateOutcome({
    storyContext, actionChosen: 'Jeg stikker trolden med min dolk', stat: 'agility',
    outcome: 'success', currentScene: 'En trold spærrer broen.',
  })

  it('says a gearless hero has empty hands and must improvise', async () => {
    await outcome(withGear([]))
    expect(prompt()).toContain('What they carry: NOTHING yet, empty hands')
    expect(prompt()).toMatch(/improvise with something at hand/)
  })

  it('lists the gear a hero does carry', async () => {
    await outcome(withGear(['Jagtbuen (weapon: a simple wooden hunting bow)']))
    expect(prompt()).toContain('What they carry: Jagtbuen (weapon: a simple wooden hunting bow)')
  })
})
