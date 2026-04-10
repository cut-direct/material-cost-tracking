import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json() as { magentoEntityId: number | null }

    const updated = await prisma.competitorBasketItem.update({
      where: { id },
      data: { magentoEntityId: body.magentoEntityId },
    })

    return NextResponse.json({ id: updated.id, magentoEntityId: updated.magentoEntityId })
  } catch (err) {
    console.error('basket-items PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update basket item' }, { status: 500 })
  }
}
