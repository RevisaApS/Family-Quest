import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateJSON = vi.fn().mockResolvedValue([])
const generateText = vi.fn().mockResolvedValue('')

vi.mock('@/lib/ai/gemini', () => ({
  generateJSON: (...args: unknown[]) => generateJSON(...args),
  generateText: (...args: unknown[]) => generateText(...args),
}))

import { generateScene, valuesInstruction } from '@/lib/ai/story'
import { generateActions, classifyCustomAction } from '@/lib/ai/actions'
import { generateOutcome } from '@/lib/ai/outcomes'
import { generateEpilogue } from '@/lib/ai/epilogue'
import { VALUE_THEMES, themeById } from '@/lib/game/values'
import type { StoryContext } from '@/types/ai'

const baseContext: StoryContext = {
  adventureStyle: 'realistic',
  storyHistory: [],
  characters: [
    { playerId: 'p1', playerName: 'Lucas', characterName: 'Luna', class: 'wizard' },
  ],
  currentPlayerId: 'p1',
  language: 'da',
  quest: { title: 'Den Sorte Sø', goal: 'Find lygten', villain: 'Nattefyrsten', milestonesDone: 1 },
}

const themed: StoryContext = { ...baseContext, valueTheme: 'hard-first' }

// The one thing that must never leak anywhere: the kid-facing phrasing of the
// idea. If it reaches a prompt it can reach the narration, and the game would
// be stating the lesson.
function expectNoThemePhrasingLeak(prompt: string) {
  for (const theme of VALUE_THEMES) {
    expect(prompt).not.toContain(theme.da)
    expect(prompt).not.toContain(theme.en)
  }
}

beforeEach(() => {
  generateJSON.mockClear()
  generateText.mockClear()
})

describe('valuesInstruction', () => {
  it('is empty without a theme, so an old save behaves exactly as before', () => {
    expect(valuesInstruction(undefined, false, 'da')).toBe('')
    expect(valuesInstruction('not-a-theme' as never, true, 'da')).toBe('')
  })

  it('carries the villain as a concrete person, not the idea itself', () => {
    const fragment = valuesInstruction('hard-first', false, 'da')
    expect(fragment).toContain(themeById('hard-first')!.antiVirtue)
    expectNoThemePhrasingLeak(fragment)
  })

  it('forbids preaching, mentor speeches and idea-shaped quest titles', () => {
    const fragment = valuesInstruction('control', false, 'da')
    expect(fragment).toMatch(/NEVER state a moral/i)
    expect(fragment).toMatch(/wise mentor/i)
    expect(fragment).toMatch(/quest title/i)
    expect(fragment).toMatch(/The Tale of Control/i)
  })

  it('asks the room, in Danish plural, only when a dilemma is planted', () => {
    const withDilemma = valuesInstruction('response', true, 'da')
    expect(withDilemma).toContain('Hvad gør I?')
    expect(withDilemma).toContain(themeById('response')!.dilemmaGuidance)

    const without = valuesInstruction('response', false, 'da')
    expect(without).not.toContain('Hvad gør I?')
    expect(without).not.toContain(themeById('response')!.dilemmaGuidance)
  })

  it('does not push Danish phrasing at an English table', () => {
    const english = valuesInstruction('response', true, 'en')
    expect(english).not.toContain('Hvad gør I?')
    expect(english).toMatch(/group/i)
  })
})

describe('scene prompt', () => {
  it('injects the theme into every scene of the adventure', async () => {
    await generateScene(themed)
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toContain(themeById('hard-first')!.antiVirtue)
    expect(prompt).toMatch(/HIDDEN SPINE/)
    expectNoThemePhrasingLeak(prompt)
  })

  it('says nothing about values when the adventure has no theme', async () => {
    await generateScene(baseContext)
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).not.toMatch(/HIDDEN SPINE/)
    expect(prompt).not.toContain(themeById('hard-first')!.antiVirtue)
  })

  it('plants the dilemma only on the scene that carries it', async () => {
    await generateScene({ ...themed, dilemma: true })
    const withDilemma = generateJSON.mock.calls[0][0] as string
    expect(withDilemma).toContain("THIS SCENE CARRIES THE CHAPTER'S ONE CHOICE")
    expect(withDilemma).toContain('Hvad gør I?')

    generateJSON.mockClear()
    await generateScene(themed)
    const without = generateJSON.mock.calls[0][0] as string
    expect(without).not.toContain('Hvad gør I?')
  })

  it('keeps the theme out of the invented quest title and villain name', async () => {
    await generateScene({ ...themed, quest: null, isFirstScene: true })
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toMatch(/NEVER named in the quest title/i)
    expectNoThemePhrasingLeak(prompt)
  })
})

describe('action prompt on a dilemma scene', () => {
  it('shapes a tempting shortcut, the harder right thing and one ordinary option', async () => {
    await generateActions({ ...themed, dilemma: true }, 'To veje deler sig ved klippen.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toContain('THE TEMPTING SHORTCUT')
    expect(prompt).toContain('THE HARDER RIGHT THING')
    expect(prompt).toContain('ONE ORDINARY OPTION')
    expect(prompt).toContain(themeById('hard-first')!.dilemmaGuidance)
    expectNoThemePhrasingLeak(prompt)
  })

  it('names the shortcut\'s reward in the action text and hides which is which', async () => {
    await generateActions({ ...themed, dilemma: true }, 'En kiste står åben.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toMatch(/prize is named right there in the action text/i)
    expect(prompt).toMatch(/Never label them and never hint which is which/i)
  })

  it('never lets the harder choice be graded down — virtue must not roll harder', async () => {
    await generateActions({ ...themed, dilemma: true }, 'En kiste står åben.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toMatch(/HARDER RIGHT THING must NEVER get a worse "sceneFit"/i)
    // The stock "one good, one okay, one risky" spread would force a grade onto
    // one of the two real choices, so it stands down for this scene
    expect(prompt).not.toContain('One option should be "good"')
  })

  it('drops the dilemma in battle, where all 3 actions must be attacks', async () => {
    await generateActions({
      ...themed,
      dilemma: true,
      encounterPhase: 'active',
      encounter: { kind: 'monster', name: 'Skyggeulven', hp: 4, maxHp: 7 },
    }, 'Ulven springer frem.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).not.toContain('THE TEMPTING SHORTCUT')
    expect(prompt).toContain('ALL 3 actions must be ways to ATTACK')
  })

  it('leaves an ordinary scene exactly as it was', async () => {
    await generateActions(themed, 'En sti gennem skoven.')
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).not.toContain('THE TEMPTING SHORTCUT')
    expect(prompt).toContain('One option should be "good"')
  })
})

describe('a kid\'s own idea is graded exactly as before', () => {
  it('never sees the dilemma framing, so no idea is judged for being un-virtuous', async () => {
    generateJSON.mockResolvedValueOnce({ stat: 'heart', sceneFit: 'good', sceneFitReason: 'Fin plan!' })
    await classifyCustomAction(
      { ...themed, dilemma: true },
      'To veje deler sig ved klippen.',
      'Jeg vil bygge en bro af mine tæpper'
    )
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).not.toContain('THE TEMPTING SHORTCUT')
    expect(prompt).not.toContain('HIDDEN SPINE')
    expect(prompt).not.toContain(themeById('hard-first')!.antiVirtue)
    expect(prompt).not.toContain(themeById('hard-first')!.dilemmaGuidance)
    expect(prompt).toContain('never reject it')
  })
})

describe('outcome prompt after a dilemma', () => {
  const outcomeArgs = {
    actionChosen: 'Jeg tager guldet og løber',
    stat: 'agility' as const,
    outcome: 'success' as const,
    currentScene: 'En kiste står åben, og en dreng råber om hjælp.',
  }

  it('complicates both branches — neither is safe, neither is punished', async () => {
    await generateOutcome({ ...outcomeArgs, storyContext: { ...themed, dilemma: true } })
    const prompt = generateText.mock.calls[0][0] as string
    expect(prompt).toContain("THIS TURN ANSWERED THE SCENE'S CHOICE")
    expect(prompt).toMatch(/in the same breath the world complicates/i)
    expect(prompt).toMatch(/never as a punishment/i)
    expect(prompt).toMatch(/Sometimes, not every time, it also complicates/i)
    expectNoThemePhrasingLeak(prompt)
  })

  it('bans the lesson, the scolding and the praise', async () => {
    await generateOutcome({ ...outcomeArgs, storyContext: { ...themed, dilemma: true } })
    const prompt = generateText.mock.calls[0][0] as string
    expect(prompt).toMatch(/no lesson, no moral, no virtue words/i)
    expect(prompt).toMatch(/no narrator comment on the choice/i)
  })

  it('says nothing extra on an ordinary turn', async () => {
    await generateOutcome({ ...outcomeArgs, storyContext: themed })
    const prompt = generateText.mock.calls[0][0] as string
    expect(prompt).not.toContain("THIS TURN ANSWERED THE SCENE'S CHOICE")
    // The original rules are untouched
    expect(prompt).toContain('The action succeeds.')
  })
})

describe('epilogue award', () => {
  const epilogueContext = {
    language: 'da' as const,
    adventureStyle: 'realistic' as const,
    questTitle: 'Den Sorte Sø',
    questGoal: 'Find lygten',
    villain: 'Nattefyrsten',
    storyHistory: ['[Luna · Jeg bliver hos ulven · ✓] Porten lukkede, men hun blev.'],
    heroes: [{
      playerId: 'p1',
      characterName: 'Luna',
      playerName: 'Lucas',
      class: 'wizard' as const,
      level: 3,
      stats: { turns: 8, successes: 5, crits: 1, fumbles: 1 },
    }],
  }

  it('names the costly moment and stops there', async () => {
    generateJSON.mockResolvedValueOnce({ title: '', story: '', awards: [] })
    await generateEpilogue({ ...epilogueContext, valueTheme: 'response' })
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toMatch(/names THAT EXACT MOMENT/i)
    expect(prompt).toMatch(/stayed with the wounded wolf/i)
    expect(prompt).toMatch(/NEVER state or hint at a lesson, a moral or a value/i)
    expect(prompt).toContain(themeById('response')!.dilemmaGuidance)
    expectNoThemePhrasingLeak(prompt)
  })

  it('keeps exactly one award per hero', async () => {
    generateJSON.mockResolvedValueOnce({ title: '', story: '', awards: [] })
    await generateEpilogue({ ...epilogueContext, valueTheme: 'response' })
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toContain('EXACTLY one award per hero')
  })

  it('still writes awards for an adventure that carried no theme', async () => {
    generateJSON.mockResolvedValueOnce({ title: '', story: '', awards: [] })
    await generateEpilogue(epilogueContext)
    const prompt = generateJSON.mock.calls[0][0] as string
    expect(prompt).toMatch(/names THAT EXACT MOMENT/i)
    for (const theme of VALUE_THEMES) {
      expect(prompt).not.toContain(theme.dilemmaGuidance)
    }
  })
})
