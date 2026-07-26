'use client'

// Shared IndexedDB access for big binary-ish blobs (data URLs) that would
// blow the zustand localStorage bucket. v1 had only portraits; v2 adds
// item images.

const DB_NAME = 'family-quest'
const DB_VERSION = 2

export const PORTRAITS_STORE = 'portraits'
export const ITEM_IMAGES_STORE = 'item-images'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      for (const store of [PORTRAITS_STORE, ITEM_IMAGES_STORE]) {
        if (!request.result.objectStoreNames.contains(store)) {
          request.result.createObjectStore(store)
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Values are stored as structured clones, so records go in as-is — no JSON
// round-trip for the megabyte-sized data URLs these stores are full of.
export async function idbGet<T = string>(store: string, key: string): Promise<T | null> {
  try {
    const db = await openDb()
    const result = await new Promise<T | null>((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get(key)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

export async function idbPut<T = string>(store: string, key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    console.error(`Failed to write to ${store}:`, error)
  }
}
