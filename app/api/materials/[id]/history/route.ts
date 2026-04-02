import { NextRequest, NextResponse } from 'next/server'
import { getCostHistory } from '@/lib/db/materials'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const history = await getCostHistory(id)
    return NextResponse.json(history)
  } catch (error) {
    console.error('[GET /api/materials/[id]/history]', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost history', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}
