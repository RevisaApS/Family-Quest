'use client'

// Hero portraits are ~1-2 MB data URLs — far too big for the zustand
// localStorage bucket (5 MB quota), so they live in IndexedDB keyed by
// playerId. Missing portraits are always a soft failure: the game falls
// back to text descriptions.

import { idbGet, idbPut, PORTRAITS_STORE } from './idb'

// Bump whenever heroVisualDescription changes what a hero looks like, so
// portraits painted by the old recipe get repainted instead of quietly
// reused for the rest of the family's adventures.
//
// v2: heroes start empty-handed. v1 portraits handed out free class gear —
// the warrior's sword and shield, the wizard's staff — and since a portrait
// is the reference image for every later scene, that gear kept reappearing
// in the paintings no matter what the hero actually owned.
export const PORTRAIT_RECIPE_VERSION = 2

interface StoredPortrait {
  dataUrl: string
  recipeVersion: number
}

export interface PortraitEntry {
  dataUrl: string
  // Painted by an older recipe: safe to show, but repaint before it feeds
  // a scene image.
  stale: boolean
}

// A portrait is a function of the words that painted it, so the description
// is the cache key. Mason painting a warrior, trying rogue, then going back
// to warrior gets his first warrior painting handed straight back instead of
// the family paying to paint it twice.
function hashDescription(description: string): string {
  // FNV-1a, 32-bit. Enough to tell a handful of class/gender/name combos
  // apart, and stable across reloads — which is the whole point.
  let hash = 0x811c9dc5
  for (let i = 0; i < description.length; i++) {
    hash ^= description.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

// Variants share the portraits store with the active portraits, under their
// own `variant:` namespace so a player id can never collide with one.
function variantKey(playerId: string, description: string): string {
  return `variant:${playerId}:${hashDescription(description)}`
}

// Passing the description files the portrait under that combination too, so
// coming back to it later is free. Leave it off when you are only promoting
// an already-cached painting back to being this player's active one.
export async function savePortrait(
  playerId: string,
  dataUrl: string,
  description?: string
): Promise<void> {
  const record: StoredPortrait = { dataUrl, recipeVersion: PORTRAIT_RECIPE_VERSION }
  await idbPut<StoredPortrait>(PORTRAITS_STORE, playerId, record)
  if (description) {
    await idbPut<StoredPortrait>(PORTRAITS_STORE, variantKey(playerId, description), record)
  }
}

// The portrait this player already has for exactly this combination, or null.
// A variant from an older recipe is no use to anyone — it would hand back the
// free class gear the repaint machinery exists to get rid of.
export async function loadPortraitVariant(
  playerId: string,
  description: string
): Promise<string | null> {
  const stored = await idbGet<StoredPortrait | string>(
    PORTRAITS_STORE, variantKey(playerId, description)
  )
  if (!stored || typeof stored === 'string' || !stored.dataUrl) return null
  return stored.recipeVersion === PORTRAIT_RECIPE_VERSION ? stored.dataUrl : null
}

// Portraits saved before versioning existed are bare data URL strings, and
// every one of them predates empty-handed heroes — so they are stale.
export async function loadPortraitEntry(playerId: string): Promise<PortraitEntry | null> {
  const stored = await idbGet<StoredPortrait | string>(PORTRAITS_STORE, playerId)
  if (!stored) return null
  if (typeof stored === 'string') return { dataUrl: stored, stale: true }
  if (!stored.dataUrl) return null
  return { dataUrl: stored.dataUrl, stale: stored.recipeVersion !== PORTRAIT_RECIPE_VERSION }
}

// A stale portrait counts as no portrait: scenes fall back to the written
// hero descriptions, which is the soft failure this whole module is built
// around, rather than smuggling unearned gear into the art.
export async function loadPortrait(playerId: string): Promise<string | null> {
  const entry = await loadPortraitEntry(playerId)
  return entry && !entry.stale ? entry.dataUrl : null
}

export async function loadPortraits(playerIds: string[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    playerIds.map(async id => [id, await loadPortrait(id)] as const)
  )
  return new Map(entries.filter((e): e is [string, string] => !!e[1]))
}

// Who is due a repaint. Players with no portrait at all are left alone —
// they chose to skip it.
export async function stalePortraitIds(playerIds: string[]): Promise<string[]> {
  const entries = await Promise.all(
    playerIds.map(async id => [id, await loadPortraitEntry(id)] as const)
  )
  return entries.filter(([, entry]) => entry?.stale).map(([id]) => id)
}

// Downscale to a small square JPEG so a party of four stays well under
// serverless body limits when portraits ride along on scene-image requests.
export function downscalePortrait(dataUrl: string, size = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const side = Math.min(img.width, img.height)
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2, side, side,
          0, 0, size, size
        )
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
