import { NextRequest, NextResponse } from 'next/server'
import { generateScene } from '@/lib/ai/story'
import type { StoryContext } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const context: StoryContext = await request.json()
    const scene = await generateScene(context)
    return NextResponse.json(scene)
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json({ error: 'Failed to generate scene' }, { status: 500 })
  }
}
