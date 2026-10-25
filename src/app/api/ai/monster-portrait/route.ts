import { NextRequest, NextResponse } from 'next/server'
import { generateMonsterPortrait } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

export async function POST(request: NextRequest) {
  try {
    const { name, appearance, style }: { name: string; appearance: string; style: AdventureStyle } = await request.json()
    if (!name || !appearance) {
      return NextResponse.json({ error: 'name and appearance are required', imageUrl: null }, { status: 400 })
    }
    const imageUrl = await generateMonsterPortrait(name, appearance, style)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Monster portrait error:', error)
    return NextResponse.json({ error: 'Failed to generate monster portrait', imageUrl: null }, { status: 500 })
  }
}
