import { NextRequest, NextResponse } from 'next/server'
import { generateSceneImage } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

interface ImageRequest {
  sceneDescription: string
  style: AdventureStyle
  heroDescriptions?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, style, heroDescriptions }: ImageRequest = await request.json()
    const imageUrl = await generateSceneImage(sceneDescription, style, heroDescriptions ?? [])
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', imageUrl: null }, { status: 500 })
  }
}
