import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const COMPETITORS = [
  'simply-plastics',
  'plastic-people',
  'cut-plastic-sheeting',
  'sheet-plastics',
  'plastic-sheet-shop',
  'plastic-sheets',
] as const

const COMPETITOR_LABELS: Record<string, string> = {
  'simply-plastics':      'Simply Plastics',
  'plastic-people':       'Plastic People',
  'cut-plastic-sheeting': 'Cut Plastic Sheeting',
  'sheet-plastics':       'Sheet Plastics',
  'plastic-sheet-shop':   'Plastic Sheet Shop',
  'plastic-sheets':       'Plastic Sheets',
}

export async function GET() {
  try {
    const basketItems = await prisma.competitorBasketItem.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    })

    // For each competitor, get the two most recent successful runs
    const competitorData = await Promise.all(
      COMPETITORS.map(async (slug) => {
        const runs = await prisma.competitorRun.findMany({
          where: { competitor: slug, status: { in: ['success', 'partial'] } },
          orderBy: { runAt: 'desc' },
          take: 2,
          include: { prices: true },
        })
        const [current, previous] = runs
        return { slug, label: COMPETITOR_LABELS[slug], current, previous }
      })
    )

    // For each basket item, get Cut My's retail price via magentoEntityId
    const cutMyPrices: Record<string, number | null> = {}
    const cutMyNames: Record<string, string | null> = {}
    for (const item of basketItems) {
      if (item.magentoEntityId) {
        const material = await prisma.material.findFirst({
          where: { magentoEntityId: item.magentoEntityId },
        })
        if (material && material.markupMultiplier && material.costPerSheet) {
          const sheetAreaM2 = (Number(material.widthMm) * Number(material.heightMm)) / 1_000_000
          const retailPerSheet = Number(material.costPerSheet) * Number(material.markupMultiplier)
          cutMyPrices[item.id] = sheetAreaM2 > 0 ? retailPerSheet / sheetAreaM2 : null
        } else {
          cutMyPrices[item.id] = null
        }
        cutMyNames[item.id] = material?.magentoName ?? null
      } else {
        cutMyPrices[item.id] = null
        cutMyNames[item.id] = null
      }
    }

    return NextResponse.json({
      basketItems: basketItems.map((i) => ({
        id: i.id,
        name: i.name,
        thicknessMm: Number(i.thicknessMm),
        widthMm: i.widthMm,
        heightMm: i.heightMm,
        magentoEntityId: i.magentoEntityId ?? null,
        cutMyVariantName: cutMyNames[i.id] ?? null,
      })),
      competitors: competitorData.map(({ slug, label, current, previous }) => ({
        slug,
        label,
        runAt: current?.runAt ?? null,
        previousRunAt: previous?.runAt ?? null,
        prices: basketItems.map((item) => {
          const currentPrice = current?.prices.find((p) => p.basketItemId === item.id)
          const previousPrice = previous?.prices.find((p) => p.basketItemId === item.id)
          return {
            basketItemId: item.id,
            pricePerM2: currentPrice?.pricePerM2 !== null && currentPrice?.pricePerM2 !== undefined
              ? Number(currentPrice.pricePerM2)
              : null,
            previousPricePerM2: previousPrice?.pricePerM2 !== null && previousPrice?.pricePerM2 !== undefined
              ? Number(previousPrice.pricePerM2)
              : null,
            rawValue: currentPrice?.rawValue ?? null,
          }
        }),
      })),
      cutMyPrices,
      cutMyNames,
    })
  } catch (err) {
    console.error('competitor-prices API error:', err)
    return NextResponse.json({ error: 'Failed to load competitor prices' }, { status: 500 })
  }
}
