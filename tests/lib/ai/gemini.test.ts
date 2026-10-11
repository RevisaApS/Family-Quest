import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateContent = vi.fn()
const getGenerativeModel = vi.fn().mockReturnValue({ generateContent })

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel }
  }),
  SchemaType: { STRING: 'string', OBJECT: 'object', ARRAY: 'array' },
}))

describe('gemini client', () => {
  beforeEach(() => {
    getGenerativeModel.mockClear()
    generateContent.mockReset()
  })

  it('asks for gemini-3.6-flash with minimal thinking and a timeout', async () => {
    const { generateText } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ response: { text: () => 'en historie' } })

    await generateText('prompt')

    const [modelParams, requestOptions] = getGenerativeModel.mock.calls[0]
    // gemini-3.5-flash is deprecated and silently routed to 3.6, which
    // ignores thinkingBudget and thinks at "medium" unless told otherwise.
    expect(modelParams.model).toBe('gemini-3.6-flash')
    // Three of these run back to back per turn; thinking tripled the wait
    // without making the story better.
    expect(modelParams.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' })
    // A call that never settles must not strand the table on a spinner.
    expect(requestOptions.timeout).toBeGreaterThan(0)
  })

  it('passes a responseSchema through when one is given', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ response: { text: () => '{"a":1}' } })

    const schema = { type: 'object', properties: {} } as never
    await generateJSON('prompt', schema)

    const [modelParams] = getGenerativeModel.mock.calls[0]
    expect(modelParams.generationConfig.responseMimeType).toBe('application/json')
    expect(modelParams.generationConfig.responseSchema).toBe(schema)
  })

  it('retries once when the model returns JSON it cannot repair', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent
      .mockResolvedValueOnce({ response: { text: () => '{"narration": ' } })
      .mockResolvedValueOnce({ response: { text: () => '{"narration":"Porten flyver op."}' } })

    const result = await generateJSON<{ narration: string }>('prompt')

    expect(generateContent).toHaveBeenCalledTimes(2)
    expect(result.narration).toBe('Porten flyver op.')
  })

  it('gives up after one retry rather than hanging the turn', async () => {
    const { generateJSON } = await import('@/lib/ai/gemini')
    generateContent.mockResolvedValue({ response: { text: () => 'I cannot do that.' } })

    await expect(generateJSON('prompt')).rejects.toThrow()
    expect(generateContent).toHaveBeenCalledTimes(2)
  })
})
