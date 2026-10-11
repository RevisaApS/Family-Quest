import { describe, it, expect, vi } from 'vitest'

const generateContent = vi.fn()
const getGenerativeModel = vi.fn().mockReturnValue({ generateContent })

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel }
  }),
}))

const { generateHeroPortrait } = await import('@/lib/ai/images')

const IMAGE_RESPONSE = {
  response: {
    candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
  },
}

describe('image model chain', () => {
  // gemini-3-pro-image-preview was shut down on 2026-06-25, and every portrait
  // then failed before the kids could start an adventure.
  it('tries the GA Nano Banana Pro first, then Nano Banana 2.1, and never a shut-down preview', async () => {
    generateContent.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(IMAGE_RESPONSE)

    const portrait = await generateHeroPortrait('Mason, a young boy wizard')

    const tried = getGenerativeModel.mock.calls.map(([params]) => params.model)
    expect(tried).toEqual(['gemini-3-pro-image', 'gemini-nano-banana-2.1'])
    expect(portrait).toBe('data:image/png;base64,AAAA')
  })
})
