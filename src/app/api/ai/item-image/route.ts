import { NextRequest, NextResponse } from 'next/server'
import { generateItemImage } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

interface ItemImageRequest {
  name: string
  look: string
  bonus: number
  style: AdventureStyle
}

export async function POST(request: NextRequest) {
  try {
    const { name, look, bonus, style }: ItemImageRequest = await request.json()
    const imageUrl = await generateItemImage(name, look ?? '', bonus ?? 0, style)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Item image generation error:', error)
    // Client falls back to the slot emoji
    return NextResponse.json({ error: 'Failed to generate item image', imageUrl: null }, { status: 500 })
  }
}
