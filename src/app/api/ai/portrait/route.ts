import { NextRequest, NextResponse } from 'next/server'
import { generateHeroPortrait } from '@/lib/ai/images'

export async function POST(request: NextRequest) {
  try {
    const { heroDescription }: { heroDescription: string } = await request.json()
    const imageUrl = await generateHeroPortrait(heroDescription)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Portrait generation error:', error)
    return NextResponse.json({ error: 'Failed to generate portrait', imageUrl: null }, { status: 500 })
  }
}
