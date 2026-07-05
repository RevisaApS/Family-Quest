import { NextRequest, NextResponse } from 'next/server'
import { generateLootName } from '@/lib/ai/loot'
import type { AdventureStyle, EquipSlot, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface LootRequest {
  slot: EquipSlot
  stat: Stat
  language: Language
  sceneContext: string
  style?: AdventureStyle
}

export async function POST(request: NextRequest) {
  try {
    const body: LootRequest = await request.json()
    const { name, look } = await generateLootName(body)
    return NextResponse.json({ name, look })
  } catch (error) {
    console.error('Loot naming error:', error)
    // Client falls back to a canned name and generic look
    return NextResponse.json({ error: 'Failed to name loot', name: null, look: null }, { status: 500 })
  }
}
