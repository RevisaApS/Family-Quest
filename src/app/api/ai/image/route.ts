import { NextRequest, NextResponse } from 'next/server'
import { generateSceneImage, type LabelledReference, type ReferenceImage, type SceneCreature } from '@/lib/ai/images'
import type { AdventureStyle } from '@/types/game'

interface ImageRequest {
  sceneDescription: string
  style: AdventureStyle
  heroDescriptions?: string[]
  // Hero portraits and the monster portrait (data URLs), each labelled with
  // who it shows, used as reference images for character consistency
  references?: Array<{ label: string; dataUrl: string }>
  // The creature in a fight, with its fixed look
  creature?: SceneCreature | null
}

function toReferenceImage(dataUrl: string): ReferenceImage | null {
  const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/)
  return match ? { mimeType: match[1], data: match[2] } : null
}

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, style, heroDescriptions, references, creature }: ImageRequest = await request.json()
    const labelled = (references ?? [])
      .map(r => {
        const image = toReferenceImage(r.dataUrl)
        return image && r.label ? { label: r.label, image } : null
      })
      .filter((r): r is LabelledReference => !!r)
    const imageUrl = await generateSceneImage(
      sceneDescription, style, heroDescriptions ?? [], labelled,
      creature?.name && creature.appearance ? creature : null
    )
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', imageUrl: null }, { status: 500 })
  }
}
