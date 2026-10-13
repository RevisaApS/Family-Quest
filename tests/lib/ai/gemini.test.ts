import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateContent = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent } }
  }),
  ThinkingLevel: { MINIMAL: 'MINIMAL', LOW: 'LOW' },
  Type: { STRING: 'STRING', OBJECT: 'OBJECT', ARRAY: 'ARRAY' },
}))

describe('gemini client', () => {
  beforeEach(() => {
    generateContent.mockReset()
  })

  it('asks the fast writer, gemini-3.6-flash, with minimal thinking and a timeout', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ text: 'en historie' })

    await expect(generateText('prompt')).resolves.toBe('en historie')

    const [request] = generateContent.mock.calls[0]
    // gemini-3.5-flash is deprecated and silently routed to 3.6, which
    // ignores thinkingBudget and thinks at "medium" unless told otherwise.
    expect(request.model).toBe('gemini-3.6-flash')
    expect(request.contents).toBe('prompt')
    // Three of these run back to back per turn; thinking tripled the wait
    // without making the story better.
    expect(request.config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' })
    // A call that never settles must not strand the table on a spinner.
    expect(request.config.httpOptions.timeout).toBeGreaterThan(0)
  })

  it('throws on an empty answer so the UI can retry or carry on', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ text: undefined })

    await expect(generateText('prompt')).rejects.toThrow()
  })

  it('passes a responseSchema through when one is given', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ text: '{"a":1}' })

    const schema = { type: 'OBJECT', properties: {} } as never
    await generateJSON('prompt', schema)

    const [request] = generateContent.mock.calls[0]
    expect(request.config.responseMimeType).toBe('application/json')
    expect(request.config.responseSchema).toBe(schema)
  })

  it('retries once when the model returns JSON it cannot repair', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent
      .mockResolvedValueOnce({ text: '{"narration": ' })
      .mockResolvedValueOnce({ text: '{"narration":"Porten flyver op."}' })

    const result = await generateJSON<{ narration: string }>('prompt')

    expect(generateContent).toHaveBeenCalledTimes(2)
    expect(result.narration).toBe('Porten flyver op.')
  })

  it('gives up after one retry rather than hanging the turn', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ text: 'I cannot do that.' })

    await expect(generateJSON('prompt')).rejects.toThrow()
    expect(generateContent).toHaveBeenCalledTimes(2)
  })

  it('sends story prose to gemini-3.8-flash at low thinking', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ text: 'Porten knirker.' })

    await generateText('prompt', 'story')

    const [request] = generateContent.mock.calls[0]
    // 3.6 misspelled Danish in a third of its texts; 3.8 in 1 of 28.
    expect(request.model).toBe('gemini-3.8-flash')
    expect(request.config.thinkingConfig).toEqual({ thinkingLevel: 'LOW' })
  })

  it('falls back to the fast writer when a story call fails', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce({ text: 'Porten knirker.' })

    await expect(generateText('prompt', 'story')).resolves.toBe('Porten knirker.')
    expect(generateContent.mock.calls.map(([r]) => r.model)).toEqual(['gemini-3.8-flash', 'gemini-3.6-flash'])
  })

  it('does not retry a failed fast call in generateText', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent.mockRejectedValueOnce(new Error('503'))

    await expect(generateText('prompt')).rejects.toThrow('503')
    expect(generateContent).toHaveBeenCalledTimes(1)
  })

  it('retries a story JSON call on the fast writer', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent
      .mockResolvedValueOnce({ text: '{"narration": ' })
      .mockResolvedValueOnce({ text: '{"narration":"Porten flyver op."}' })

    await expect(generateJSON('prompt', undefined, 1.2, 'story')).resolves.toEqual({ narration: 'Porten flyver op.' })
    expect(generateContent.mock.calls.map(([r]) => r.model)).toEqual(['gemini-3.8-flash', 'gemini-3.6-flash'])
  })
})
