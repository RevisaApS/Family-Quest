import { NextRequest, NextResponse } from 'next/server'
import { generateCliffhanger } from '@/lib/ai/cliffhanger'

export async function POST(request: NextRequest) {
  try {
    const { context, currentScene } = await request.json()
    const hook = await generateCliffhanger({ storyContext: context, currentScene })
    return NextResponse.json({ hook })
  } catch (error) {
    console.error('Cliffhanger generation error:', error)
    return NextResponse.json({ error: 'Failed to generate cliffhanger' }, { status: 500 })
  }
}
