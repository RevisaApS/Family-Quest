import { NextRequest, NextResponse } from 'next/server'
import { generateNarration } from '@/lib/ai/tts'

export async function POST(request: NextRequest) {
  try {
    const { text }: { text: string } = await request.json()
    const audioUrl = await generateNarration(text)
    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error('TTS generation error:', error)
    return NextResponse.json({ error: 'Failed to generate audio', audioUrl: null }, { status: 500 })
  }
}
