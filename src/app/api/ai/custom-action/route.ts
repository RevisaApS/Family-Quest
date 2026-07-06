import { NextRequest, NextResponse } from 'next/server'
import { classifyCustomAction } from '@/lib/ai/actions'
import type { StoryContext } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const { context, currentScene, idea }: {
      context: StoryContext
      currentScene: string
      idea: string
    } = await request.json()
    if (!idea?.trim()) {
      return NextResponse.json({ error: 'Missing idea' }, { status: 400 })
    }
    const action = await classifyCustomAction(context, currentScene, idea.trim())
    return NextResponse.json(action)
  } catch (error) {
    console.error('Custom action grading error:', error)
    return NextResponse.json({ error: 'Failed to grade action' }, { status: 500 })
  }
}
