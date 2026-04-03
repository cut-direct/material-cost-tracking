import { NextRequest, NextResponse } from 'next/server'
import { getMaterials, createMaterial } from '@/lib/db/materials'
import type { MaterialFilters } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const filters: MaterialFilters = {}
    const category = searchParams.get('category')
    const typeFinish = searchParams.get('typeFinish')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')

    if (category) filters.category = category
    if (typeFinish) filters.typeFinish = typeFinish
    if (supplierId) filters.supplierId = supplierId
    if (search) filters.search = search

    const materials = await getMaterials(filters)

    return NextResponse.json({ materials, total: materials.length })
  } catch (error) {
    console.error('[GET /api/materials]', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const material = await createMaterial(body)
    return NextResponse.json({ material }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/materials]', error)
    const message = error instanceof Error ? error.message : 'Failed to create material'
    return NextResponse.json({ error: message, code: 'CREATE_ERROR' }, { status: 500 })
  }
}
