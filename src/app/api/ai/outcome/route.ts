import { NextRequest, NextResponse } from 'next/server'
import { generateOutcome } from '@/lib/ai/outcomes'

export async function POST(request: NextRequest) {
  try {
    const context = await request.json()
    const narrative = await generateOutcome(context)
    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('Outcome generation error:', error)
    return NextResponse.json({ error: 'Failed to generate outcome' }, { status: 500 })
  }
}
