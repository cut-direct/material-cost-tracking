import { NextRequest, NextResponse } from 'next/server'
import { deleteMaterials } from '@/lib/db/materials'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    const result = await deleteMaterials(ids)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/materials/bulk-delete]', error)
    return NextResponse.json(
      { error: 'Delete failed', code: 'DELETE_ERROR' },
      { status: 500 },
    )
  }
}
