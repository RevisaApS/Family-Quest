'use client'

// Generated item images are data URLs around a megabyte each — like
// portraits they live in IndexedDB, keyed by item id + adventure style so
// the shop catalog is only ever painted once per style.

import { idbGet, idbPut, ITEM_IMAGES_STORE } from './idb'

export function itemImageKey(itemId: string, style: string): string {
  return `${itemId}:${style}`
}

export async function loadItemImage(key: string): Promise<string | null> {
  return idbGet(ITEM_IMAGES_STORE, key)
}

export async function saveItemImage(key: string, dataUrl: string): Promise<void> {
  await idbPut(ITEM_IMAGES_STORE, key, dataUrl)
}
