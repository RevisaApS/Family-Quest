'use client'

// Hero portraits are ~1-2 MB data URLs — far too big for the zustand
// localStorage bucket (5 MB quota), so they live in IndexedDB keyed by
// playerId. Missing portraits are always a soft failure: the game falls
// back to text descriptions.

const DB_NAME = 'family-quest'
const STORE = 'portraits'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePortrait(playerId: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, playerId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    console.error('Failed to save portrait:', error)
  }
}

export async function loadPortrait(playerId: string): Promise<string | null> {
  try {
    const db = await openDb()
    const result = await new Promise<string | null>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(playerId)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

export async function loadPortraits(playerIds: string[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    playerIds.map(async id => [id, await loadPortrait(id)] as const)
  )
  return new Map(entries.filter((e): e is [string, string] => !!e[1]))
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
