'use client'

// One portrait per monster, filed under its encounter id, so a reload in the
// middle of a fight still paints the same creature without painting it again.
import { idbGet, idbPut, MONSTERS_STORE } from './idb'

export function loadMonsterPortrait(encounterId: string): Promise<string | null> {
  return idbGet<string>(MONSTERS_STORE, encounterId)
}

export function saveMonsterPortrait(encounterId: string, dataUrl: string): Promise<void> {
  return idbPut<string>(MONSTERS_STORE, encounterId, dataUrl)
}
