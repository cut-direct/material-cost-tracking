import { NextRequest, NextResponse } from 'next/server'
import { cancelStagedChange } from '@/lib/db/staged-changes'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await cancelStagedChange(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[DELETE /api/staged-changes/[id]]', error)
    const message = error instanceof Error ? error.message : 'Cancel failed'
    // Check if it was a not-found error
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Staged change not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: message, code: 'DELETE_ERROR' },
      { status: 500 }
    )
  }
}
