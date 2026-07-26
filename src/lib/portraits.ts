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

export async function savePortrait(playerId: string, dataUrl: string): Promise<void> {
  await idbPut<StoredPortrait>(PORTRAITS_STORE, playerId, {
    dataUrl,
    recipeVersion: PORTRAIT_RECIPE_VERSION,
  })
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
