import { describe, it, expect, vi } from 'vitest'

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel: vi.fn() }
  }),
}))

const { buildImagePrompt, buildItemImagePrompt } = await import('@/lib/ai/images')

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
    const prompt = buildImagePrompt('a misty forest path', 'whimsical', [HERO], true)
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
