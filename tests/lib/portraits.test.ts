import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = new Map<string, unknown>()

vi.mock('@/lib/idb', () => ({
  PORTRAITS_STORE: 'portraits',
  idbGet: vi.fn(async (_s: string, key: string) => store.get(key) ?? null),
  idbPut: vi.fn(async (_s: string, key: string, value: unknown) => { store.set(key, value) }),
}))

const {
  savePortrait, loadPortrait, loadPortraits, loadPortraitEntry, stalePortraitIds,
  loadPortraitVariant, PORTRAIT_RECIPE_VERSION,
} = await import('@/lib/portraits')

const FRESH = 'data:image/jpeg;base64,fresh'
const LEGACY = 'data:image/jpeg;base64,legacy'

describe('portrait recipe versioning', () => {
  beforeEach(() => store.clear())

  it('stamps saved portraits with the current recipe version', async () => {
    await savePortrait('p1', FRESH)
    expect(store.get('p1')).toEqual({ dataUrl: FRESH, recipeVersion: PORTRAIT_RECIPE_VERSION })
  })

  it('reads back a portrait it just saved', async () => {
    await savePortrait('p1', FRESH)
    expect(await loadPortrait('p1')).toBe(FRESH)
    expect(await loadPortraitEntry('p1')).toEqual({ dataUrl: FRESH, stale: false })
  })

  it('treats a bare data URL as a pre-versioning portrait', async () => {
    // Everything saved before versioning shows the free class gear.
    store.set('p1', LEGACY)
    expect(await loadPortraitEntry('p1')).toEqual({ dataUrl: LEGACY, stale: true })
  })

  it('treats a portrait from an older recipe as stale', async () => {
    store.set('p1', { dataUrl: LEGACY, recipeVersion: PORTRAIT_RECIPE_VERSION - 1 })
    expect((await loadPortraitEntry('p1'))?.stale).toBe(true)
  })

  it('hides stale portraits from the scene-image path', async () => {
    // A stale portrait must never ride along as a reference image — it would
    // put a sword back in the hands of a hero who owns nothing.
    store.set('p1', LEGACY)
    expect(await loadPortrait('p1')).toBeNull()

    await savePortrait('p2', FRESH)
    const map = await loadPortraits(['p1', 'p2'])
    expect(map.has('p1')).toBe(false)
    expect(map.get('p2')).toBe(FRESH)
  })

  it('lists exactly who is due a repaint', async () => {
    store.set('p1', LEGACY)
    await savePortrait('p2', FRESH)
    // p3 never had a portrait — skipping it is a choice, not staleness.
    expect(await stalePortraitIds(['p1', 'p2', 'p3'])).toEqual(['p1'])
  })

  it('returns nothing for a player with no portrait', async () => {
    expect(await loadPortraitEntry('nobody')).toBeNull()
    expect(await loadPortrait('nobody')).toBeNull()
  })
})

// Mason paints a warrior, tries rogue, then goes back to warrior. The warrior
// painting he already has should come back instead of being paid for twice.
describe('portrait variant cache', () => {
  const WARRIOR = 'Mason, a brave young boy warrior in a plain undyed linen tunic'
  const ROGUE = 'Mason, a brave young boy rogue in plain dark travelling clothes'
  const WARRIOR_ART = 'data:image/jpeg;base64,warrior'
  const ROGUE_ART = 'data:image/jpeg;base64,rogue'

  beforeEach(() => store.clear())

  it('hands back a combination this player was already painted as', async () => {
    await savePortrait('mason', WARRIOR_ART, WARRIOR)
    await savePortrait('mason', ROGUE_ART, ROGUE)

    // Both survive the switch — the rogue did not overwrite the warrior.
    expect(await loadPortraitVariant('mason', WARRIOR)).toBe(WARRIOR_ART)
    expect(await loadPortraitVariant('mason', ROGUE)).toBe(ROGUE_ART)
    // ...and the last one painted is still who Mason currently is.
    expect(await loadPortrait('mason')).toBe(ROGUE_ART)
  })

  it('misses on a combination nobody painted yet', async () => {
    await savePortrait('mason', WARRIOR_ART, WARRIOR)
    expect(await loadPortraitVariant('mason', ROGUE)).toBeNull()
  })

  it('keeps one player out of another player\'s cache', async () => {
    await savePortrait('mason', WARRIOR_ART, WARRIOR)
    expect(await loadPortraitVariant('ellie', WARRIOR)).toBeNull()
  })

  it('files nothing under a combination when no description is given', async () => {
    // Promoting a cached painting back to active must not re-file it.
    await savePortrait('mason', WARRIOR_ART)
    expect(await loadPortrait('mason')).toBe(WARRIOR_ART)
    expect(await loadPortraitVariant('mason', WARRIOR)).toBeNull()
  })

  it('ignores a variant painted by an older recipe', async () => {
    await savePortrait('mason', WARRIOR_ART, WARRIOR)
    const key = [...store.keys()].find(k => k.startsWith('variant:'))!
    store.set(key, { dataUrl: WARRIOR_ART, recipeVersion: PORTRAIT_RECIPE_VERSION - 1 })
    expect(await loadPortraitVariant('mason', WARRIOR)).toBeNull()
  })

  it('keeps variant keys out of the active-portrait namespace', async () => {
    await savePortrait('mason', WARRIOR_ART, WARRIOR)
    // The sweep walks player ids; a variant must never be mistaken for one.
    expect([...store.keys()].filter(k => !k.startsWith('variant:'))).toEqual(['mason'])
    expect(await stalePortraitIds(['mason'])).toEqual([])
  })
})
