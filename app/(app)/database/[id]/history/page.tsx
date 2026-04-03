import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMaterialById, getCostHistory } from '@/lib/db/materials'
import { TopBar } from '@/components/layout/TopBar'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function MaterialHistoryPage({ params }: Props) {
  let material = null
  let history: Awaited<ReturnType<typeof getCostHistory>> = []
  try {
    ;[material, history] = await Promise.all([
      getMaterialById(params.id),
      getCostHistory(params.id),
    ])
  } catch {
    notFound()
  }

  if (!material) notFound()

  return (
    <>
      <TopBar
        title={`Cost History — ${material.description}`}
        actions={
          <Link
            href="/database"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Database
          </Link>
        }
      />
      <main className="px-6 py-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
          {/* Material info */}
          <div className="mb-6 pb-6 border-b border-[#E5E5E3]">
            <h2 className="text-base font-semibold text-gray-900">{material.description}</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              {material.thicknessMm}mm · {material.heightMm} × {material.widthMm}mm ·{' '}
              {material.supplier?.name}
            </p>
            <p className="text-[13px] font-medium tabular-nums text-gray-900 mt-2">
              Current: {formatCurrency(material.costPerSheet)}
            </p>
          </div>

          {/* Timeline */}
          {history.length === 0 ? (
            <p className="text-[13px] text-gray-400">No cost history recorded.</p>
          ) : (
            <div className="history-timeline">
              {history.map((entry, idx) => {
                const changeAmount = entry.newCost - entry.previousCost
                const changePercent =
                  entry.previousCost > 0
                    ? ((changeAmount / entry.previousCost) * 100).toFixed(1)
                    : null
                const isIncrease = changeAmount > 0
                const changedAt = new Date(entry.changedAt)

                return (
                  <div key={entry.id} className="relative mb-6 last:mb-0">
                    <div className="history-timeline-dot" />
                    <time
                      dateTime={entry.changedAt}
                      title={format(changedAt, 'dd MMM yyyy HH:mm')}
                      className="text-[12px] text-gray-400 block mb-1"
                    >
                      {idx === 0 && (
                        <span className="font-medium text-gray-700">Latest — </span>
                      )}
                      {formatDistanceToNow(changedAt, { addSuffix: true })} ·{' '}
                      {format(changedAt, 'dd MMM yyyy')}
                    </time>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="tabular-nums text-[13px] font-medium text-gray-400 line-through">
                        {formatCurrency(entry.previousCost)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="tabular-nums text-[13px] font-semibold text-gray-900">
                        {formatCurrency(entry.newCost)}
                      </span>
                      {changePercent !== null && (
                        <span
                          className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                            isIncrease
                              ? 'bg-red-50 text-red-600'
                              : 'bg-[#E6F4F1] text-[#1A7A6A]'
                          }`}
                        >
                          {isIncrease ? '+' : ''}
                          {changePercent}%
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-[12px] text-gray-400 mt-1 italic">{entry.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
