import { NextRequest, NextResponse } from 'next/server'
import { applyStagedChanges } from '@/lib/db/staged-changes'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    console.log('[CRON] apply-staged-changes running at', new Date().toISOString())
    const result = await applyStagedChanges()
    console.log('[CRON] apply-staged-changes result', result)

    return NextResponse.json({
      success: true,
      applied: result.applied,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON] apply-staged-changes error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'CRON_ERROR' },
      { status: 500 }
    )
  }
}
