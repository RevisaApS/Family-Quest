import { describe, it, expect } from 'vitest'
import { parseStoryLine, buildRecap, shouldShowRecap } from '@/lib/game/recap'

describe('resume recap ("Sidst i eventyret…")', () => {
  it('parses the play page\'s story-memory line shape', () => {
    expect(parseStoryLine('[Lukas den Tapre · Jeg skubber porten op · ✓] Porten braser op.')).toEqual({
      hero: 'Lukas den Tapre', action: 'Jeg skubber porten op', tag: '✓', text: 'Porten braser op.',
    })
    expect(parseStoryLine('[Mason · Jeg kaster en gnist · ✗] ').text).toBe('Jeg kaster en gnist')
  })

  it('keeps lines from older saves as plain text instead of dropping them', () => {
    expect(parseStoryLine('Mason chose to run. It worked.')).toEqual({ text: 'Mason chose to run. It worked.' })
  })

  it('takes the last three beats in story order and skips blanks', () => {
    const history = ['[A · a · ✓] one', '', '[B · b · ~] two', '[C · c · ✗] three', '[D · d · ✓] four']
    expect(buildRecap(history).map(b => b.text)).toEqual(['two', 'three', 'four'])
    expect(buildRecap(history, 2).map(b => b.hero)).toEqual(['C', 'D'])
  })

  it('shows a recap only when there is a story to recap', () => {
    expect(shouldShowRecap([])).toBe(false)
    expect(shouldShowRecap(['', '  '])).toBe(false)
    expect(shouldShowRecap(['[A · a · ✓] one'])).toBe(true)
  })
})
