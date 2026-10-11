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
  // Nano Banana 2.1 won Steven's blind portrait test 4.67 to 3.00 on 2026-10-11.
  it('tries Nano Banana 2.1 first, then the GA Nano Banana Pro, and never a shut-down preview', async () => {
    generateContent.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(IMAGE_RESPONSE)

    const portrait = await generateHeroPortrait('Mason, a young boy wizard')

    const tried = getGenerativeModel.mock.calls.map(([params]) => params.model)
    expect(tried).toEqual(['gemini-nano-banana-2.1', 'gemini-3-pro-image'])
    expect(portrait).toBe('data:image/png;base64,AAAA')
  })
})
