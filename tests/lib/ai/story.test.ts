import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StoryContext } from '@/types/ai'

const generateJSON = vi.fn()
vi.mock('@/lib/ai/gemini', () => ({ generateJSON: (...args: unknown[]) => generateJSON(...args) }))

const { generateScene, sceneSchema } = await import('@/lib/ai/story')
const { CHARACTER_VOICES } = await import('@/lib/ai/segments')

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
    generateJSON.mockResolvedValue({ segments: [{ speaker: 'narrator', text: 'Porten knirker.' }], imagePrompt: '', suggestedNextPlayer: 'p1' })
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

  it('makes the nod to a past adventure a job of the opening scene', async () => {
    // As an optional hook the nod landed in about 1 opening in 3; the kids
    // notice when the game forgets what they did.
    await generateScene({
      ...CONTEXT,
      pastAdventures: [{ questTitle: 'Den Tabte Lygte', villain: 'Fru Tang' }],
    })
    const prompt = promptFrom(0)
    expect(prompt).toContain('Four extra jobs')
    expect(prompt).toMatch(/4\. THE FAMILY'S LEGEND[^\n]*Fru Tang \(in "Den Tabte Lygte"\)[^\n]*MUST name Fru Tang[^\n]*shown this way: /)
    // One job, not two: the optional later-scene wording stays out.
    expect(prompt).not.toContain('Nod to that history when it fits')
  })

  it('asks for the nod in a different shape across openings', async () => {
    const past = [{ questTitle: 'Den Tabte Lygte', villain: 'Fru Tang' }]
    for (let i = 0; i < 10; i++) await generateScene({ ...CONTEXT, pastAdventures: past })
    const legendLines = new Set(
      generateJSON.mock.calls.map(c => (c[0] as string).split('\n').find(l => l.startsWith('4. THE FAMILY')))
    )
    expect(legendLines.size).toBeGreaterThan(4)
  })

  it('leaves the legend job out for a family with no past adventures', async () => {
    await generateScene(CONTEXT)
    const prompt = promptFrom(0)
    expect(prompt).toContain('Three extra jobs')
    expect(prompt).not.toContain("THE FAMILY'S LEGEND")
  })

  it('keeps the legend optional once the quest is under way', async () => {
    await generateScene({
      ...CONTEXT,
      isFirstScene: false,
      quest: { title: 'Den Tabte Lygte', goal: 'Find lygten', villain: 'Fru Tang', milestonesDone: 1 },
      pastAdventures: [{ questTitle: 'Solstenens Vogtere', villain: 'Malakor' }],
    })
    const prompt = promptFrom(0)
    expect(prompt).toContain('Nod to that history when it fits')
    expect(prompt).not.toContain('shown this way')
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

describe('generateScene: segments for the narrator', () => {
  beforeEach(() => {
    generateJSON.mockReset()
  })

  const LATER: StoryContext = {
    ...CONTEXT,
    isFirstScene: false,
    quest: { title: 'Den Tabte Lygte', goal: 'Find lygten', villain: 'Fru Tang', milestonesDone: 1 },
  }

  it('asks for segments instead of a narration string, with a fixed set of voices', () => {
    const schema = sceneSchema(LATER)
    expect(schema.required).toContain('segments')
    expect(schema.required).not.toContain('narration')
    const item = schema.properties!.segments.items!
    expect(item.required).toEqual(['speaker', 'text'])
    expect(item.properties!.speaker.enum).toEqual(['narrator', 'character'])
    expect(item.properties!.voice.enum).toEqual([...CHARACTER_VOICES])
  })

  it('still declares the opening scene and encounter fields alongside segments', () => {
    expect(sceneSchema(CONTEXT).required).toEqual(
      expect.arrayContaining(['segments', 'questTitle', 'questGoal', 'villainName'])
    )
    expect(sceneSchema({ ...LATER, encounterPhase: 'arriving-monster' }).required).toContain('encounterName')
  })

  it('joins the segments into the narration everything else reads', async () => {
    generateJSON.mockResolvedValue({
      segments: [
        { speaker: 'narrator', text: 'En trold spærrer broen.' },
        { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' },
        { speaker: 'narrator', text: 'Hvad gør I?' },
      ],
      imagePrompt: 'A troll on a bridge',
      suggestedNextPlayer: 'p1',
    })
    const scene = await generateScene(LATER)
    expect(scene.narration).toBe('En trold spærrer broen. »Ingen kommer over min bro!« Hvad gør I?')
    expect(scene.segments).toHaveLength(3)
    expect(scene.segments[1]).toEqual({ speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' })
    expect(scene.imagePrompt).toBe('A troll on a bridge')
  })

  it('fails, so the retry button appears, when no usable segment comes back', async () => {
    // A blank page used to come through as narration: '' and strand the table
    for (const segments of [[], 'not a list', [{ speaker: 'narrator', text: '   ' }], undefined]) {
      generateJSON.mockResolvedValue({ segments, imagePrompt: 'A gate', suggestedNextPlayer: 'p1' })
      await expect(generateScene(LATER)).rejects.toThrow('without any story')
    }
  })

  it('keeps a line with Danish quotes intact for the story memory and recap', async () => {
    generateJSON.mockResolvedValue({
      segments: [
        { speaker: 'character', name: 'Heksen', voice: 'menacing', text: '»Kom nærmere,«' },
        { speaker: 'narrator', text: 'hvisker heksen.' },
      ],
      imagePrompt: 'A witch',
      suggestedNextPlayer: 'p1',
    })
    const scene = await generateScene(LATER)
    // The model's own quotes are stripped before ours go on: never »»doubled««
    expect(scene.narration).toBe('»Kom nærmere,« hvisker heksen.')
  })

  it('tells the model dialogue is optional, short, and never for the heroes', async () => {
    generateJSON.mockResolvedValue({ segments: [{ speaker: 'narrator', text: 'Natten falder på.' }], imagePrompt: '', suggestedNextPlayer: 'p1' })
    await generateScene(LATER)
    const prompt = promptFrom(0)
    expect(prompt).toContain('Dialogue is optional: at most one or two short spoken lines')
    expect(prompt).toContain('The heroes never get spoken lines')
    expect(prompt).toContain('2-3 sentences')
    for (const voice of CHARACTER_VOICES) expect(prompt).toContain(voice)
  })
})

describe('generateScene: monsters keep their look', () => {
  beforeEach(() => {
    generateJSON.mockReset()
    generateJSON.mockResolvedValue({ segments: [{ speaker: 'narrator', text: 'Trolden brøler.' }], imagePrompt: 'Mosetrolden roars', suggestedNextPlayer: 'p1' })
  })

  const LATER: StoryContext = {
    ...CONTEXT,
    isFirstScene: false,
    quest: { title: 'Den Tabte Lygte', goal: 'Find lygten', villain: 'Fru Tang', milestonesDone: 1 },
  }
  const TROLL = 'A hulking moss-green troll the size of a hut, with one cracked tusk.'
  const FIGHT: StoryContext = {
    ...LATER,
    encounterPhase: 'active',
    encounter: { kind: 'monster', name: 'Mosetrolden', hp: 4, maxHp: 6, appearance: TROLL },
  }

  it('asks the arrival scene for a fixed English look, for monsters and the boss', async () => {
    for (const encounterPhase of ['arriving-monster', 'arriving-boss'] as const) {
      expect(sceneSchema({ ...LATER, encounterPhase }).required).toEqual(
        expect.arrayContaining(['encounterName', 'encounterAppearance'])
      )
    }
    await generateScene({ ...LATER, encounterPhase: 'arriving-monster' })
    expect(promptFrom(0)).toMatch(/"encounterAppearance": one or two concrete sentences IN ENGLISH/)
    expect(promptFrom(0)).toMatch(/fixed for the whole fight/)
  })

  it('leaves the look out of ordinary scenes', () => {
    expect(sceneSchema(LATER).properties).not.toHaveProperty('encounterAppearance')
    expect(sceneSchema(FIGHT).properties).not.toHaveProperty('encounterAppearance')
  })

  it('gives the fight scene the fixed look and keeps the creature out of the picture prompt', async () => {
    await generateScene(FIGHT)
    const prompt = promptFrom(0)
    expect(prompt).toContain(`Mosetrolden looks like this, and the look never changes: ${TROLL}`)
    expect(prompt).toMatch(/In "imagePrompt", call it "Mosetrolden" and do not describe its body/)
    expect(prompt).not.toContain('Describe the location, mood and any creatures')
  })

  it('exempts the creature being fought from KEEP IT FRESH, and only during the fight', async () => {
    await generateScene(FIGHT)
    expect(promptFrom(0)).toContain('The one exception is Mosetrolden, the creature the heroes are fighting')
    await generateScene(LATER)
    expect(promptFrom(1)).toContain('KEEP IT FRESH')
    expect(promptFrom(1)).not.toContain('The one exception')
  })

  it('keeps an old fight without a look working as before', async () => {
    await generateScene({ ...FIGHT, encounter: { ...FIGHT.encounter!, appearance: undefined } })
    expect(promptFrom(0)).not.toContain('looks like this')
    expect(promptFrom(0)).toContain('Describe the location, mood and any creatures')
  })
})
