import { describe, it, expect } from 'vitest'
import { fallbackHook, tidyHook, HOOK_MAX_CHARS } from '@/lib/game/cliffhanger'

describe('cliffhanger (the last line of a session)', () => {
  it('always has a Danish line to fall back on, naming the villain when there is one', () => {
    expect(fallbackHook('da', 'Skyggekongen')).toBe('Men et sted i mørket venter Skyggekongen stadig...')
    expect(fallbackHook('da')).toBe('Men eventyret er ikke slut endnu...')
    expect(fallbackHook('en', '  ')).toBe('But the adventure is not over yet...')
  })

  it('tidies the model\'s line: one sentence, no quotes, trailing off', () => {
    expect(tidyHook('"Men oppe på klippen så noget jer gå."')).toBe('Men oppe på klippen så noget jer gå...')
    expect(tidyHook('Broen bag jer knager. Og så bliver alt stille. Hvad nu?')).toBe('Broen bag jer knager...')
    expect(tidyHook('  Noget   rører sig i tågen…  ')).toBe('Noget rører sig i tågen...')
  })

  it('refuses junk so the caller falls back', () => {
    expect(tidyHook('')).toBeNull()
    expect(tidyHook(null)).toBeNull()
    expect(tidyHook('...')).toBeNull()
    expect(tidyHook('x'.repeat(HOOK_MAX_CHARS + 1))).toBeNull()
  })
})
