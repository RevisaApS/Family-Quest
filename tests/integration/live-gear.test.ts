import { describe, it, expect } from 'vitest'
import { generateActions } from '@/lib/ai/actions'
import { describeGear } from '@/lib/game/loot'
import { SHOP_CATALOG, toLootItem } from '@/lib/game/shop'
import type { StoryContext } from '@/types/ai'

// Preflight against the REAL Gemini API: action options must only use gear
// the hero actually carries (Mason and Lucas, 2026-10-12: "why can we stab
// them with a dagger when we don't have one?"). Skipped without a key.
const hasKey = !!process.env.GOOGLE_AI_API_KEY
const REPEATS = 6

// Weapons and tools a hero might be handed by a model guessing from the class.
const INVENTED = /\b(dolk\w*|kniv\w*|bue\b|buen\w*|pil\b|pile\w*|pilen\w*|sværd\w*|økse\w*|spyd\w*|armbrøst\w*|slynge\w*|stav\b|staven\w*|tryllestav\w*|skjold\w*)/i

const gearless = (cls: 'rogue' | 'ranger' | 'warrior', name: string): StoryContext['characters'][number] => ({
  playerId: `p-${name}`, playerName: name, characterName: name, class: cls,
  rpg: { level: 1, hp: 10, maxHp: 10, knockedOut: false, skillNames: [], gearNames: [] },
})

const base: StoryContext = {
  adventureStyle: 'realistic',
  language: 'da',
  storyHistory: [],
  characters: [gearless('rogue', 'Ravn'), gearless('ranger', 'Storm')],
  currentPlayerId: 'p-Ravn',
  encounterPhase: 'none',
  quest: { title: 'Den Sorte Krone', goal: 'Find kronen', villain: 'Skyggegreven', milestonesDone: 1 },
}

async function inventedOptions(context: StoryContext, scene: string) {
  const runs = await Promise.all(Array.from({ length: REPEATS }, () => generateActions(context, scene)))
  const all = runs.flat().map(a => a.text)
  const bad = all.filter(text => INVENTED.test(text))
  console.log(`\n--- ${bad.length} of ${all.length} options use gear nobody carries ---\n${bad.join('\n')}\n--- a few of the options ---\n${all.slice(0, 6).join('\n')}\n`)
  return bad
}

describe.skipIf(!hasKey)('live action options respect what heroes carry', () => {
  it('a gearless rogue in battle is never handed a weapon', async () => {
    const bad = await inventedOptions({
      ...base,
      encounterPhase: 'active',
      encounter: { kind: 'monster', name: 'Mosetrolden', hp: 4, maxHp: 4 },
    }, 'Mosetrolden brøler og svinger sin kølle mod jer midt på den smalle bro.')
    expect(bad).toEqual([])
  }, 120_000)

  it('a gearless ranger exploring is never handed a bow', async () => {
    const bad = await inventedOptions(
      { ...base, currentPlayerId: 'p-Storm' },
      'Et hjortedyr står helt stille i lysningen, og bag det skimter I en gammel vagtpost i træerne.',
    )
    expect(bad).toEqual([])
  }, 120_000)

  it('a ranger who bought a bow gets to use it', async () => {
    const bow = describeGear(toLootItem(SHOP_CATALOG.find(i => i.id === 'shop-bow-1')!, 'da'))
    const storm = gearless('ranger', 'Storm')
    const context: StoryContext = {
      ...base,
      characters: [base.characters[0], { ...storm, rpg: { ...storm.rpg!, gearNames: [bow] } }],
      currentPlayerId: 'p-Storm',
      encounterPhase: 'active',
      encounter: { kind: 'monster', name: 'Mosetrolden', hp: 4, maxHp: 4 },
    }
    const scene = 'Mosetrolden brøler og svinger sin kølle mod jer midt på den smalle bro.'
    const runs = await Promise.all(Array.from({ length: REPEATS }, () => generateActions(context, scene)))
    const usesBow = runs.flat().filter(a => /bue|pil|skyd/i.test(a.text))
    expect(usesBow.length).toBeGreaterThan(0)
  }, 120_000)
})
