import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = new Map<string, unknown>()

vi.mock('@/lib/idb', () => ({
  PORTRAITS_STORE: 'portraits',
  idbGet: vi.fn(async (_s: string, key: string) => store.get(key) ?? null),
  idbPut: vi.fn(async (_s: string, key: string, value: unknown) => { store.set(key, value) }),
}))

const {
  savePortrait, loadPortrait, loadPortraits, loadPortraitEntry, stalePortraitIds,
  PORTRAIT_RECIPE_VERSION,
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
