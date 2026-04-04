import { NextRequest, NextResponse } from 'next/server'
import { generateSceneImage } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, style }: { sceneDescription: string; style: AdventureStyle } = await request.json()
    const imageUrl = await generateSceneImage(sceneDescription, style)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', imageUrl: null }, { status: 500 })
  }
}
