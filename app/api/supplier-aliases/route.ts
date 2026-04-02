import { NextRequest, NextResponse } from 'next/server'
import { saveAlias, getAliases } from '@/lib/db/supplier-aliases'
import type { SaveAliasRequest } from '@/types'

export async function GET() {
  try {
    const aliases = await getAliases()
    return NextResponse.json(aliases)
  } catch (error) {
    console.error('[GET /api/supplier-aliases]', error)
    return NextResponse.json(
      { error: 'Failed to fetch aliases', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveAliasRequest = await request.json()

    if (!body.rawText || typeof body.rawText !== 'string' || !body.rawText.trim()) {
      return NextResponse.json(
        { error: 'rawText is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!body.materialId || typeof body.materialId !== 'string') {
      return NextResponse.json(
        { error: 'materialId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const alias = await saveAlias(body.rawText.trim(), body.materialId, body.supplierId)
    return NextResponse.json(alias, { status: 201 })
  } catch (error) {
    console.error('[POST /api/supplier-aliases]', error)
    return NextResponse.json(
      { error: 'Failed to save alias', code: 'SAVE_ERROR' },
      { status: 500 }
    )
  }
}
