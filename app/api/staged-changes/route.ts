import { NextResponse } from 'next/server'
import { getStagedChanges } from '@/lib/db/staged-changes'

export async function GET() {
  try {
    const changes = await getStagedChanges()
    return NextResponse.json(changes)
  } catch (error) {
    console.error('[GET /api/staged-changes]', error)
    return NextResponse.json(
      { error: 'Failed to fetch staged changes', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}
