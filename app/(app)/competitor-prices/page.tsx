'use client'

import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

interface BasketItem {
  id: string
  name: string
  thicknessMm: number
  widthMm: number
  heightMm: number
}

interface PriceEntry {
  basketItemId: string
  pricePerM2: number | null
  previousPricePerM2: number | null
  rawValue: string | null
}

interface CompetitorData {
  slug: string
  label: string
  runAt: string | null
  previousRunAt: string | null
  prices: PriceEntry[]
}

interface ApiResponse {
  basketItems: BasketItem[]
  competitors: CompetitorData[]
  cutMyPrices: Record<string, number | null>
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '—'
  return `£${value.toFixed(2)}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Delta({ current, previous }: { current: number | null; previous: number | null }) {
  if (current == null || previous == null) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.01) return null

  const pct = (diff / previous) * 100
  const up = diff > 0
  // Price going UP = competitor getting more expensive = good for Cut My = green
  // Price going DOWN = competitor getting cheaper = bad for Cut My = red
  const colour = up ? 'text-green-600' : 'text-red-500'
  const Icon = up ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${colour} ml-1.5`}>
      <Icon size={10} />
      {up ? '+' : ''}£{Math.abs(diff).toFixed(2)}
      <span className="opacity-70">({up ? '+' : ''}{pct.toFixed(1)}%)</span>
    </span>
  )
}

function PriceCell({
  entry,
  cutMyPrice,
  isCutMy,
}: {
  entry?: PriceEntry
  cutMyPrice: number | null
  isCutMy?: boolean
}) {
  const price = entry?.pricePerM2 ?? null
  const previous = entry?.previousPricePerM2 ?? null

  const hasComparison = price != null && cutMyPrice != null && !isCutMy
  const cheaper = hasComparison && price < cutMyPrice
  const pricier = hasComparison && price > cutMyPrice

  return (
    <td
      className={[
        'px-4 py-3 text-right text-sm tabular-nums',
        isCutMy ? 'bg-[#2DBDAA]/10 font-semibold text-[#1a8a7a]' : 'text-gray-700',
        cheaper ? 'text-red-600' : '',
        pricier ? 'text-green-700' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="font-mono">{fmt(price)}</span>
      {!isCutMy && <Delta current={price} previous={previous} />}
    </td>
  )
}

export default function CompetitorPricesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<ApiResponse>({
    queryKey: ['competitor-prices'],
    queryFn: () => fetch('/api/competitor-prices').then((r) => r.json()),
  })

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Competitor Prices</h1>
          <p className="text-sm text-gray-500 mt-1">
            £/m² inc VAT · 1000 × 1000mm · 3mm Clear Acrylic · delta vs previous run
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
          Failed to load competitor prices.
        </div>
      )}

      {data && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Variant
                </th>
                {/* Cut My column */}
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-[#1a8a7a] bg-[#2DBDAA]/10">
                  Cut My
                </th>
                {/* Competitor columns */}
                {data.competitors.map((c) => (
                  <th key={c.slug} className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    <div>{c.label}</div>
                    <div className="text-[10px] font-normal text-gray-400 normal-case mt-0.5">
                      {fmtDate(c.runAt)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.basketItems.map((item) => {
                const cutMyPrice = data.cutMyPrices[item.id] ?? null
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">
                        {item.widthMm} × {item.heightMm}mm
                      </div>
                    </td>
                    {/* Cut My */}
                    <PriceCell cutMyPrice={cutMyPrice} isCutMy />
                    {/* Competitors */}
                    {data.competitors.map((c) => {
                      const entry = c.prices.find((x) => x.basketItemId === item.id)
                      return (
                        <PriceCell
                          key={c.slug}
                          entry={entry}
                          cutMyPrice={cutMyPrice}
                        />
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {data.basketItems.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No basket items found. Run the seed script in competitor-scraper to add items.
            </div>
          )}
        </div>
      )}

      {data && data.basketItems.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">
          Competitor price shown in{' '}
          <span className="text-red-500 font-medium">red</span> = cheaper than Cut My.{' '}
          <span className="text-green-600 font-medium">Green</span> = more expensive.
          Delta indicator: <span className="text-green-600 font-medium">green ▲</span> = competitor raised price,{' '}
          <span className="text-red-500 font-medium">red ▼</span> = competitor lowered price.
        </p>
      )}
    </div>
  )
}
