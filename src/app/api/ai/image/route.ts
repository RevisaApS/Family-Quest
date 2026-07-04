import { NextRequest, NextResponse } from 'next/server'
import { generateSceneImage, type ReferenceImage } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

interface ImageRequest {
  sceneDescription: string
  style: AdventureStyle
  heroDescriptions?: string[]
  // Hero portraits (data URLs) used as reference images for character consistency
  heroPortraits?: string[]
}

function toReferenceImage(dataUrl: string): ReferenceImage | null {
  const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/)
  return match ? { mimeType: match[1], data: match[2] } : null
}

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, style, heroDescriptions, heroPortraits }: ImageRequest = await request.json()
    const references = (heroPortraits ?? [])
      .map(toReferenceImage)
      .filter((r): r is ReferenceImage => !!r)
    const imageUrl = await generateSceneImage(sceneDescription, style, heroDescriptions ?? [], references)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', imageUrl: null }, { status: 500 })
  }
}
