import { NextRequest, NextResponse } from 'next/server'
import { generateLootName } from '@/lib/ai/loot'
import type { EquipSlot, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface LootRequest {
  slot: EquipSlot
  stat: Stat
  language: Language
  sceneContext: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LootRequest = await request.json()
    const name = await generateLootName(body)
    return NextResponse.json({ name })
  } catch (error) {
    console.error('Loot naming error:', error)
    // Client falls back to a canned name
    return NextResponse.json({ error: 'Failed to name loot', name: null }, { status: 500 })
  }
}
