'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Database, RefreshCw, Clock, ChevronRight, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarProps {
  stagedCount?: number
  materialCounts?: {
    wood: {
      total: number
      mdf: number
      plywood: number
      osb: number
    }
    plastic: {
      total: number
      acrylic: number
      polycarbonate: number
      dibond: number
    }
    accessories: number
  }
  activeFilters?: {
    category?: string
    typeFinish?: string
  }
  onFilterChange?: (filters: { category?: string; typeFinish?: string }) => void
}

const NAV_ITEMS = [
  { href: '/database', label: 'Database', icon: Database },
  { href: '/price-updates', label: 'Price Updates', icon: RefreshCw },
  { href: '/staged-changes', label: 'Staged Changes', icon: Clock, badge: true },
]

interface FilterGroup {
  label: string
  category: string
  children: Array<{ label: string; typeFinish: string; countKey: string }>
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    label: 'Wood',
    category: 'Wood',
    children: [
      { label: 'MDF', typeFinish: 'MDF', countKey: 'mdf' },
      { label: 'Plywood', typeFinish: 'Plywood', countKey: 'plywood' },
      { label: 'OSB', typeFinish: 'OSB', countKey: 'osb' },
    ],
  },
  {
    label: 'Plastic',
    category: 'Plastic',
    children: [
      { label: 'Acrylic', typeFinish: 'Acrylic', countKey: 'acrylic' },
      { label: 'Polycarbonate', typeFinish: 'Polycarbonate', countKey: 'polycarbonate' },
      { label: 'Dibond', typeFinish: 'Dibond', countKey: 'dibond' },
    ],
  },
]

export function Sidebar({
  stagedCount = 0,
  materialCounts,
  activeFilters,
  onFilterChange,
}: SidebarProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Wood: true,
    Plastic: true,
  })

  function toggleGroup(category: string) {
    setExpandedGroups((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function handleCategoryClick(category: string) {
    if (activeFilters?.category === category && !activeFilters.typeFinish) {
      onFilterChange?.({})
    } else {
      onFilterChange?.({ category })
    }
  }

  function handleTypeFinishClick(category: string, typeFinish: string) {
    if (activeFilters?.category === category && activeFilters.typeFinish === typeFinish) {
      onFilterChange?.({})
    } else {
      onFilterChange?.({ category, typeFinish })
    }
  }

  function getCategoryCount(category: string) {
    if (!materialCounts) return null
    if (category === 'Wood') return materialCounts.wood.total
    if (category === 'Plastic') return materialCounts.plastic.total
    return null
  }

  function getTypeFinishCount(category: string, key: string) {
    if (!materialCounts) return null
    if (category === 'Wood') return materialCounts.wood[key as keyof typeof materialCounts.wood]
    if (category === 'Plastic') return materialCounts.plastic[key as keyof typeof materialCounts.plastic]
    return null
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30"
      style={{ backgroundColor: '#1C1E22' }}
    >
      {/* Brand */}
      <div className="flex items-center h-12 px-4 border-b border-white/5">
        <div
          className="w-6 h-6 rounded flex items-center justify-center mr-2.5 shrink-0"
          style={{ backgroundColor: '#2DBDAA' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7L7 2L12 7M3.5 6V11H10.5V6"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-white text-sm font-semibold tracking-tight">CutMy</span>
        <span className="text-[#C8CAD0] text-sm font-normal ml-1">Costs</span>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-3 pb-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'sidebar-nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors duration-150',
                isActive
                  ? 'active bg-white/8 text-white'
                  : 'hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1 text-[13px]">{label}</span>
              {badge && stagedCount > 0 && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: '#2DBDAA', color: 'white' }}
                >
                  {stagedCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/8 my-1" />

      {/* Filters */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="px-3 mb-2 text-[11px] uppercase tracking-widest font-medium" style={{ color: '#5C5F66' }}>
          Filter
        </p>

        {FILTER_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.category]
          const categoryActive =
            activeFilters?.category === group.category && !activeFilters.typeFinish
          const count = getCategoryCount(group.category)

          return (
            <div key={group.category} className="mb-0.5">
              {/* Group header */}
              <button
                type="button"
                className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-left group transition-colors duration-150 hover:bg-white/5"
                onClick={() => toggleGroup(group.category)}
              >
                {isExpanded ? (
                  <ChevronDown size={12} className="shrink-0 text-[#5C5F66] group-hover:text-[#C8CAD0]" />
                ) : (
                  <ChevronRight size={12} className="shrink-0 text-[#5C5F66] group-hover:text-[#C8CAD0]" />
                )}
                <button
                  type="button"
                  className={clsx(
                    'flex-1 text-left sidebar-filter-label transition-colors duration-150',
                    categoryActive ? 'text-white font-medium' : 'hover:text-white'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCategoryClick(group.category)
                  }}
                >
                  {group.label}
                </button>
                {count !== null && (
                  <span className="text-[11px]" style={{ color: '#5C5F66' }}>
                    {count}
                  </span>
                )}
              </button>

              {/* Children */}
              {isExpanded && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {group.children.map((child) => {
                    const childActive =
                      activeFilters?.category === group.category &&
                      activeFilters.typeFinish === child.typeFinish
                    const childCount = getTypeFinishCount(group.category, child.countKey)

                    return (
                      <button
                        key={child.typeFinish}
                        type="button"
                        onClick={() => handleTypeFinishClick(group.category, child.typeFinish)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors duration-150',
                          childActive
                            ? 'bg-white/8 text-white'
                            : 'sidebar-filter-label hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <span>{child.label}</span>
                        {childCount !== null && (
                          <span className="text-[11px]" style={{ color: '#5C5F66' }}>
                            {childCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Accessories */}
        <button
          type="button"
          onClick={() => handleCategoryClick('Accessories')}
          className={clsx(
            'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors duration-150',
            activeFilters?.category === 'Accessories'
              ? 'bg-white/8 text-white sidebar-filter-label'
              : 'sidebar-filter-label hover:bg-white/5 hover:text-white'
          )}
        >
          <span>Accessories</span>
          {materialCounts && (
            <span className="text-[11px]" style={{ color: '#5C5F66' }}>
              {materialCounts.accessories}
            </span>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[11px]" style={{ color: '#3D4048' }}>
          v0.1.0
        </p>
      </div>
    </aside>
  )
}
