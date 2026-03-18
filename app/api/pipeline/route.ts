import { NextRequest, NextResponse } from 'next/server'
import { MOCK_SCENARIOS } from '@/lib/mocks/alert'
import { runPipeline } from '@/lib/orchestrator'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { scenarioId } = body

  if (!scenarioId || !MOCK_SCENARIOS[scenarioId]) {
    return NextResponse.json(
      { error: `Invalid scenarioId. Choose from: ${Object.keys(MOCK_SCENARIOS).join(', ')}` },
      { status: 400 }
    )
  }

  const alert = MOCK_SCENARIOS[scenarioId]

  try {
    const result = await runPipeline(alert)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pipeline failed:', error)
    return NextResponse.json(
      { error: 'Pipeline execution failed' },
      { status: 500 }
    )
  }
}
