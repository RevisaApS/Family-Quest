import { describe, it, expect, vi } from 'vitest'

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent: vi.fn() } }
  }),
  Modality: { TEXT: 'TEXT', IMAGE: 'IMAGE' },
  ThinkingLevel: { MINIMAL: 'MINIMAL' },
}))

const { buildImagePrompt, buildItemImagePrompt, buildMonsterPortraitPrompt, referenceParts } = await import('@/lib/ai/images')

const HERO = 'Lukas, a brave young boy warrior, equipped with a crooked wooden stick held like a sword'

describe('buildImagePrompt', () => {
  it('carries the scene and the heroes into the prompt', () => {
    const prompt = buildImagePrompt('a misty forest path', 'whimsical', [HERO])
    expect(prompt).toContain('a misty forest path')
    expect(prompt).toContain('a crooked wooden stick held like a sword')
  })

  it('demands that carried gear is visible and that nothing extra is invented', () => {
    const prompt = buildImagePrompt('a misty forest path', 'realistic', [HERO])
    expect(prompt).toMatch(/Equipment accuracy/i)
    expect(prompt).toMatch(/instantly recognisable/i)
    expect(prompt).toMatch(/never give a hero a weapon/i)
  })

  it('skips the gear rule when there are no heroes to dress', () => {
    expect(buildImagePrompt('an empty throne room', 'dark')).not.toMatch(/Equipment accuracy/i)
  })

  it('lets the description override the gear in a reference portrait', () => {
    // Portraits are the face anchor, not the wardrobe: locking the outfit to
    // the portrait meant newly bought gear could never appear.
    const prompt = buildImagePrompt('a misty forest path', 'whimsical', [HERO], { heroReferences: true })
    expect(prompt).toContain('reference portrait')
    expect(prompt).toMatch(/decides their equipment/i)
    expect(prompt).not.toMatch(/outfit.*EXACTLY as in their reference portrait/i)
  })
})

describe('buildItemImagePrompt', () => {
  it('scales the quality cue to the item bonus', () => {
    const junk = buildItemImagePrompt('Crooked Stick', 'a crooked wooden stick', 1, 'whimsical')
    const legendary = buildItemImagePrompt('Flame Blade', 'a sword of living fire', 4, 'whimsical')
    expect(junk).toMatch(/Simple and sturdy/i)
    expect(legendary).toMatch(/Legendary/i)
  })
})

const TROLL = { name: 'Mosetrolden', appearance: 'A hulking moss-green troll the size of a hut, with one cracked tusk.' }

describe('monsters keep their look', () => {
  it('gives the creature its fixed look and points at its labelled reference', () => {
    const prompt = buildImagePrompt('Mosetrolden swings a log', 'realistic', [HERO], {
      heroReferences: true, creature: TROLL, creatureReference: true,
    })
    expect(prompt).toContain(`The creature is Mosetrolden: ${TROLL.appearance} It must match the reference labelled Mosetrolden.`)
    expect(prompt).toContain('reference labelled with their name')
  })

  it('keeps the look line without a portrait, and leaves out the reference', () => {
    const prompt = buildImagePrompt('Mosetrolden swings a log', 'realistic', [HERO], { creature: TROLL })
    expect(prompt).toContain('The creature is Mosetrolden: A hulking moss-green troll')
    expect(prompt).not.toContain('reference labelled Mosetrolden')
  })

  it('drops the generic glowing-eyed monsters when a look is fixed', () => {
    expect(buildImagePrompt('a bridge', 'realistic', [HERO])).toContain('glowing eyes')
    expect(buildImagePrompt('a bridge', 'realistic', [HERO], { creature: TROLL })).not.toContain('glowing eyes')
  })

  it('puts each label right before the picture it names', () => {
    const img = (data: string) => ({ mimeType: 'image/jpeg', data })
    const parts = referenceParts([
      { label: 'Lukas', image: img('L') },
      { label: 'Mosetrolden', image: img('M') },
    ])
    expect(parts).toEqual([
      { text: 'Reference: Lukas' },
      { inlineData: { mimeType: 'image/jpeg', data: 'L' } },
      { text: 'Reference: Mosetrolden' },
      { inlineData: { mimeType: 'image/jpeg', data: 'M' } },
    ])
  })

  it('paints the monster portrait from its name and look alone', () => {
    const prompt = buildMonsterPortraitPrompt(TROLL.name, TROLL.appearance, 'realistic')
    expect(prompt).toContain('Creature portrait of Mosetrolden: A hulking moss-green troll the size of a hut, with one cracked tusk.')
    expect(prompt).toMatch(/no people/i)
    expect(prompt).not.toContain('glowing eyes')
  })
})
