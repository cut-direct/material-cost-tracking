'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { CostHistoryPanel } from './CostHistoryPanel'
import { ImportDialog } from './ImportDialog'
import type { Material, MaterialFilters, MaterialGroup } from '@/types'

interface MaterialsTableProps {
  initialData: Material[]
  filters?: MaterialFilters
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatM2Cost(value: number | undefined): string {
  if (value === undefined) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'email-parse':
      return 'Email'
    case 'manual':
      return 'Manual'
    case 'import':
      return 'Import'
    case 'staged':
      return 'Scheduled'
    default:
      return source
  }
}

function groupMaterials(materials: Material[]): MaterialGroup[] {
  const groupMap = new Map<string, MaterialGroup>()

  for (const material of materials) {
    const key = `${material.category}::${material.typeFinish}`
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        category: material.category,
        typeFinish: material.typeFinish,
        materials: [],
      })
    }
    groupMap.get(key)!.materials.push(material)
  }

  return Array.from(groupMap.values())
}

export function MaterialsTable({ initialData, filters }: MaterialsTableProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const queryFilters: MaterialFilters = {
    ...filters,
    search: search || undefined,
  }

  const { data: materials, refetch } = useQuery<Material[]>({
    queryKey: ['materials', queryFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (queryFilters.category) params.set('category', queryFilters.category)
      if (queryFilters.typeFinish) params.set('typeFinish', queryFilters.typeFinish)
      if (queryFilters.supplierId) params.set('supplierId', queryFilters.supplierId)
      if (queryFilters.search) params.set('search', queryFilters.search)
      const res = await fetch(`/api/materials?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch materials')
      const json = await res.json()
      return json.materials
    },
    initialData: search || filters?.category || filters?.typeFinish ? undefined : initialData,
    staleTime: 30 * 1000,
  })

  const groups = useMemo(() => groupMaterials(materials ?? []), [materials])

  const toggleRow = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const handleImportSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['materials'] })
    void refetch()
  }, [queryClient, refetch])

  const totalCount = materials?.length ?? 0

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search materials…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="w-72"
          />
          <span className="text-[12px] text-gray-400">
            {totalCount} material{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        <ImportDialog onSuccess={handleImportSuccess} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E3' }}>
              <th className="text-left px-4 py-3 text-gray-500 w-[250px]">Description</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[160px]">Magento SKU</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[90px]">Thickness</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[130px]">Sheet Size</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[140px]">Supplier</th>
              <th className="text-right px-4 py-3 text-gray-500 w-[110px]">Cost/Sheet</th>
              <th className="text-right px-4 py-3 text-gray-500 w-[110px]">Cost/m²</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[120px]">Last Updated</th>
              <th className="text-left px-4 py-3 text-gray-500 w-[80px]">Source</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                  No materials found
                </td>
              </tr>
            )}

            {groups.map((group) => (
              <GroupRows
                key={`${group.category}::${group.typeFinish}`}
                group={group}
                expandedId={expandedId}
                onToggle={toggleRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GroupRows({
  group,
  expandedId,
  onToggle,
}: {
  group: MaterialGroup
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <>
      {/* Group header row */}
      <tr style={{ backgroundColor: '#EEEEEC' }}>
        <td
          colSpan={10}
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
        >
          {group.category} — {group.typeFinish}
          <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
            ({group.materials.length})
          </span>
        </td>
      </tr>

      {/* Material rows */}
      {group.materials.map((material) => {
        const isExpanded = expandedId === material.id
        const lastUpdated = new Date(material.lastUpdatedAt)

        return (
          <React.Fragment key={material.id}>
            <tr
              onClick={() => onToggle(material.id)}
              className="cursor-pointer border-b border-[#F0F0EE] transition-colors duration-100"
              style={{ backgroundColor: isExpanded ? '#F0F0EE' : undefined }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F0F0EE'
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''
                }
              }}
            >
              <td className="px-4 py-3 text-[13px] text-gray-900 font-medium">
                {material.description}
              </td>
              <td className="px-4 py-3">
                {material.magentoSku ? (
                  <span className="font-mono text-[12px] text-gray-400">{material.magentoSku}</span>
                ) : (
                  <span className="text-[12px] text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-600">
                {material.thicknessMm}mm
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-600">
                {material.widthMm} × {material.heightMm}mm
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-600">
                {material.supplier?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="cost-cell tabular-nums text-gray-900">
                  {formatCurrency(material.costPerSheet)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="cost-cell tabular-nums text-gray-500">
                  {formatM2Cost(material.costPerM2)}
                </span>
              </td>
              <td className="px-4 py-3">
                <time
                  dateTime={material.lastUpdatedAt}
                  title={format(lastUpdated, 'dd MMM yyyy HH:mm')}
                  className="text-[13px] text-gray-500"
                >
                  {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </time>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] text-gray-400">{sourceLabel(material.updateSource)}</span>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </td>
            </tr>

            {isExpanded && (
              <tr>
                <td colSpan={10} className="p-0 border-b border-[#E5E5E3]">
                  <div className="slide-down">
                    <CostHistoryPanel
                      materialId={material.id}
                      materialDescription={material.description}
                    />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
