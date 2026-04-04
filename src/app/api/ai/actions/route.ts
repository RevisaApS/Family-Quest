import { NextRequest, NextResponse } from 'next/server'
import { generateActions } from '@/lib/ai/actions'
import type { StoryContext } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const { context, currentScene }: { context: StoryContext; currentScene: string } = await request.json()
    const actions = await generateActions(context, currentScene)
    return NextResponse.json(actions)
  } catch (error) {
    console.error('Actions generation error:', error)
    return NextResponse.json({ error: 'Failed to generate actions' }, { status: 500 })
  }
}
