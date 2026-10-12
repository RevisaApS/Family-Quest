import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateJSON = vi.fn().mockResolvedValue([])

vi.mock('@/lib/ai/gemini', () => ({
  generateJSON: (...args: unknown[]) => generateJSON(...args),
  generateText: vi.fn(),
}))

import { generateActions, GEAR_RULE } from '@/lib/ai/actions'
import { describeGear } from '@/lib/game/loot'
import { SHOP_CATALOG, toLootItem } from '@/lib/game/shop'
import type { StoryContext } from '@/types/ai'

const rogue = (gearNames: string[]): StoryContext => ({
  adventureStyle: 'realistic',
  storyHistory: [],
  characters: [{
    playerId: 'p1', playerName: 'Lucas', characterName: 'Ravn', class: 'rogue',
    rpg: { level: 1, hp: 10, maxHp: 10, knockedOut: false, skillNames: [], gearNames },
  }],
  currentPlayerId: 'p1',
  language: 'da',
})

async function promptFor(context: StoryContext): Promise<string> {
  await generateActions(context, 'En trold spærrer broen.')
  return generateJSON.mock.calls[0][0] as string
}

beforeEach(() => generateJSON.mockClear())

describe('action options only use gear the hero carries', () => {
  it('says out loud that a gearless hero has empty hands', async () => {
    const prompt = await promptFor(rogue([]))
    expect(prompt).toContain('What they carry: NOTHING yet, empty hands')
    expect(prompt).toContain(GEAR_RULE)
  })

  it('lists what the hero carries, with what each thing actually is', async () => {
    const bow = describeGear(toLootItem(SHOP_CATALOG.find(i => i.id === 'shop-bow-0')!, 'da'))
    const prompt = await promptFor(rogue([bow]))
    expect(prompt).toContain('What they carry: Pind med Snor (weapon: a bent stick with a piece of string')
    expect(prompt).not.toContain('NOTHING yet')
  })

  it('forbids handing out class gear and lets only wizards cast freely', () => {
    expect(GEAR_RULE).toMatch(/no dagger, knife, sword, bow/)
    expect(GEAR_RULE).toMatch(/a wizard can always cast simple spells/)
  })
})

describe('describeGear', () => {
  it('names the item, its slot and its English look', () => {
    const helm = toLootItem(SHOP_CATALOG.find(i => i.id === 'shop-helmet-3')!, 'da')
    expect(describeGear(helm)).toBe('Den Gyldne Hjelm (helmet: a magnificent shining golden helmet with wing ornaments)')
  })

  it('still works for old saved gear without a look', () => {
    expect(describeGear({ id: 'x', slot: 'boots', name: 'Gamle Sko', emoji: '🥾', stat: 'agility', bonus: 1 }))
      .toBe('Gamle Sko (boots)')
  })
})
