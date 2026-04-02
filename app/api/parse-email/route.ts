import { NextRequest, NextResponse } from 'next/server'
import { parseEmail } from '@/lib/ai/parser'
import type { ParseEmailRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: ParseEmailRequest = await request.json()

    if (!body.emailBody || typeof body.emailBody !== 'string' || body.emailBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'emailBody is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (body.emailBody.trim().length > 50_000) {
      return NextResponse.json(
        { error: 'emailBody is too long (max 50,000 characters)', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const result = await parseEmail(body.emailBody)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/parse-email]', error)
    const message = error instanceof Error ? error.message : 'Parse failed'
    return NextResponse.json(
      { error: message, code: 'PARSE_ERROR' },
      { status: 500 }
    )
  }
}
