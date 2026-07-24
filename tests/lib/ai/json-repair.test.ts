import { describe, it, expect } from 'vitest'
import { parseJsonLoosely } from '@/lib/ai/gemini'

// Left without a responseSchema, gemini-3.5-flash returned JSON that
// JSON.parse rejected in roughly a quarter of scene calls. Schemas fix most of
// it; this repair pass is the safety net, and these are the exact shapes that
// came back from the live model.
describe('parseJsonLoosely', () => {
  it('passes clean JSON straight through', () => {
    expect(parseJsonLoosely<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
  })

  it('recovers from a doubled closing brace', () => {
    const raw = '{\n  "narration": "Porten flyver op.",\n  "suggestedNextPlayer": "p-far"\n}\n}'
    expect(parseJsonLoosely<{ suggestedNextPlayer: string }>(raw).suggestedNextPlayer).toBe('p-far')
  })

  it('strips markdown fences', () => {
    expect(parseJsonLoosely<{ name: string }>('```json\n{"name":"Skyggesnerren"}\n```').name)
      .toBe('Skyggesnerren')
  })

  it('ignores trailing prose after the object', () => {
    expect(parseJsonLoosely<{ a: number }>('{"a":1}\nHope that helps!').a).toBe(1)
  })

  it('handles action lists, not just objects', () => {
    const raw = '[{"id":"1","text":"Jeg vil snige mig frem"}]\n]'
    expect(parseJsonLoosely<Array<{ id: string }>>(raw)).toHaveLength(1)
  })

  it('is not fooled by braces inside story text', () => {
    const raw = '{"narration":"Han råbte \\"stop {nu}!\\" og løb."}\n}'
    expect(parseJsonLoosely<{ narration: string }>(raw).narration).toContain('stop {nu}!')
  })

  it('throws when the response is genuinely truncated', () => {
    expect(() => parseJsonLoosely('{"narration":"Porten flyver')).toThrow(/truncated/)
  })

  it('throws when there is no JSON at all', () => {
    expect(() => parseJsonLoosely('I could not do that.')).toThrow(/no JSON/)
  })
})
