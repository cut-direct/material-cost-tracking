import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Returns the latest price for each competitor × basket item,
// plus Cut My's own retail price derived from materials table.

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

    // For each competitor, get the most recent run and its prices
    const competitorData = await Promise.all(
      COMPETITORS.map(async (slug) => {
        const latestRun = await prisma.competitorRun.findFirst({
          where: { competitor: slug, status: { in: ['success', 'partial'] } },
          orderBy: { runAt: 'desc' },
          include: { prices: true },
        })
        return { slug, label: COMPETITOR_LABELS[slug], latestRun }
      })
    )

    // For each basket item, get Cut My's retail price
    const cutMyPrices: Record<string, number | null> = {}
    for (const item of basketItems) {
      if (item.materialRef) {
        const material = await prisma.material.findFirst({
          where: { magentoSku: item.materialRef },
        })
        if (material && material.markupMultiplier && material.costPerSheet) {
          // Retail price per sheet ÷ area of sheet in m²
          const sheetAreaM2 =
            (Number(material.widthMm) * Number(material.heightMm)) / 1_000_000
          const retailPerSheet =
            Number(material.costPerSheet) * Number(material.markupMultiplier)
          cutMyPrices[item.id] = sheetAreaM2 > 0 ? retailPerSheet / sheetAreaM2 : null
        } else {
          cutMyPrices[item.id] = null
        }
      } else {
        cutMyPrices[item.id] = null
      }
    }

    return NextResponse.json({
      basketItems: basketItems.map((i) => ({
        id: i.id,
        name: i.name,
        thicknessMm: Number(i.thicknessMm),
        widthMm: i.widthMm,
        heightMm: i.heightMm,
      })),
      competitors: competitorData.map(({ slug, label, latestRun }) => ({
        slug,
        label,
        runAt: latestRun?.runAt ?? null,
        prices: (latestRun?.prices ?? []).map((p) => ({
          basketItemId: p.basketItemId,
          pricePerM2: p.pricePerM2 !== null ? Number(p.pricePerM2) : null,
          rawValue: p.rawValue,
        })),
      })),
      cutMyPrices,
    })
  } catch (err) {
    console.error('competitor-prices API error:', err)
    return NextResponse.json({ error: 'Failed to load competitor prices' }, { status: 500 })
  }
}
