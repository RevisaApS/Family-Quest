import { NextRequest, NextResponse } from 'next/server'
import { generateEpilogue, type EpilogueContext } from '@/lib/ai/epilogue'

export async function POST(request: NextRequest) {
  try {
    const context: EpilogueContext = await request.json()
    const epilogue = await generateEpilogue(context)
    return NextResponse.json(epilogue)
  } catch (error) {
    console.error('Epilogue generation error:', error)
    return NextResponse.json({ error: 'Failed to generate epilogue' }, { status: 500 })
  }
}
