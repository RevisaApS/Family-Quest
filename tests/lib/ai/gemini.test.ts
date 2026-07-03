import { describe, it, expect, vi } from 'vitest'

// Mock the @google/generative-ai module
vi.mock('@google/generative-ai', () => {
  const getGenerativeModel = vi.fn().mockReturnValue({})
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
      return { getGenerativeModel }
    }),
  }
})

describe('gemini client', () => {
  it('uses gemini-3.5-flash model', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    // Re-import to trigger module execution with the mock
    await import('@/lib/ai/gemini')

    const instance = (GoogleGenerativeAI as any).mock.results[0].value
    const calls = instance.getGenerativeModel.mock.calls

    expect(calls).toHaveLength(2) // textModel and jsonModel
    expect(calls[0][0].model).toBe('gemini-3.5-flash')
    expect(calls[1][0].model).toBe('gemini-3.5-flash')
  })
})
