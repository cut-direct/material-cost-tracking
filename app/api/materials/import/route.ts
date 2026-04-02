import { NextRequest, NextResponse } from 'next/server'
import { importMaterialsFromCsv } from '@/lib/csv/importer'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let csvText: string

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file provided', code: 'NO_FILE' }, { status: 400 })
      }
      csvText = await (file as File).text()
    } else if (contentType.includes('application/json')) {
      const body = await request.json() as { csvText?: unknown }
      if (typeof body.csvText !== 'string') {
        return NextResponse.json({ error: 'Missing csvText field', code: 'NO_CSV_TEXT' }, { status: 400 })
      }
      csvText = body.csvText
    } else {
      return NextResponse.json({ error: 'Unsupported content type', code: 'UNSUPPORTED_CONTENT_TYPE' }, { status: 415 })
    }

    const result = await importMaterialsFromCsv(csvText)
    return NextResponse.json(result)
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
