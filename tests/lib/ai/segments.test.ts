import { describe, it, expect } from 'vitest'
import {
  CHARACTER_VOICES, MAX_NAME_CHARS, joinSegments, narratorOnly, normalizeSegments, optionsSegments,
} from '@/lib/ai/segments'

describe('normalizeSegments', () => {
  it('keeps well-formed narrator and character segments in order', () => {
    const segments = normalizeSegments([
      { speaker: 'narrator', text: 'En trold spærrer broen.' },
      { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' },
      { speaker: 'narrator', text: 'brummer den.' },
    ])
    expect(segments).toEqual([
      { speaker: 'narrator', text: 'En trold spærrer broen.' },
      { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' },
      { speaker: 'narrator', text: 'brummer den.' },
    ])
  })

  it('strips quote marks the model wraps around a spoken line', () => {
    const [line] = normalizeSegments([
      { speaker: 'character', name: 'Nisse', voice: 'squeaky', text: '»Hihi, fanget!«' },
    ])
    expect(line.text).toBe('Hihi, fanget!')
  })

  it('gives an unknown voice the friendly default instead of dropping the line', () => {
    const [line] = normalizeSegments([{ speaker: 'character', name: 'Kroejer', voice: 'opera', text: 'Velkommen!' }])
    expect(line.voice).toBe('friendly')
    expect(CHARACTER_VOICES).toContain(line.voice)
  })

  it('drops empty and malformed entries', () => {
    const segments = normalizeSegments([
      null,
      'just a string',
      { speaker: 'narrator' },
      { speaker: 'narrator', text: '   ' },
      { speaker: 'character', voice: 'gruff', text: '""' },
      { speaker: 'narrator', text: 'Stilhed.' },
    ])
    expect(segments).toEqual([{ speaker: 'narrator', text: 'Stilhed.' }])
  })

  it('returns nothing when segments are missing or every one is broken', () => {
    expect(normalizeSegments(undefined)).toEqual([])
    expect(normalizeSegments('not a list')).toEqual([])
    expect(normalizeSegments([{ nope: true }, { speaker: 'narrator', text: ' ' }])).toEqual([])
  })

  it('caps an overlong speaker name', () => {
    const [line] = normalizeSegments([{ speaker: 'character', name: 'Trold'.repeat(30), voice: 'gruff', text: 'Hm!' }])
    expect(line.name!.length).toBeLessThanOrEqual(MAX_NAME_CHARS)
    expect(line.name!.startsWith('TroldTrold')).toBe(true)
  })
})

describe('joinSegments', () => {
  const segments = normalizeSegments([
    { speaker: 'narrator', text: 'En trold spærrer broen.' },
    { speaker: 'character', name: 'Trolden', voice: 'gruff', text: 'Ingen kommer over min bro!' },
    { speaker: 'narrator', text: 'brummer den.' },
  ])

  it('wraps spoken lines in Danish guillemets', () => {
    expect(joinSegments(segments, 'da')).toBe('En trold spærrer broen. »Ingen kommer over min bro!« brummer den.')
  })

  it('uses curly quotes in English', () => {
    expect(joinSegments(segments, 'en')).toBe('En trold spærrer broen. “Ingen kommer over min bro!” brummer den.')
  })

  it('is plain narration when nobody speaks', () => {
    expect(joinSegments(narratorOnly('Natten falder på.'), 'da')).toBe('Natten falder på.')
  })
})

describe('optionsSegments', () => {
  it('reads all three choices as one narrator segment, numbered in Danish', () => {
    expect(optionsSegments(['Jeg sniger mig forbi', 'Jeg råber på trolden!', 'Jeg kaster en ildkugle'], 'da')).toEqual([
      {
        speaker: 'narrator',
        text: 'Hvad gør I? Én: Jeg sniger mig forbi. To: Jeg råber på trolden! Tre: Jeg kaster en ildkugle.',
      },
    ])
  })

  it('numbers them in English', () => {
    const [segment] = optionsSegments(['Sneak past', 'Shout', 'Cast a fireball'], 'en')
    expect(segment.text).toBe('What do you do? One: Sneak past. Two: Shout. Three: Cast a fireball.')
  })

  it('skips blank options and reads nothing when there are none', () => {
    expect(optionsSegments(['  ', 'Løb'], 'da')[0].text).toBe('Hvad gør I? Én: Løb.')
    expect(optionsSegments([], 'da')).toEqual([])
  })
})
