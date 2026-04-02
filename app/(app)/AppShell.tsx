'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

interface AppShellProps {
  children: ReactNode
  stagedCount: number
  materialCounts?: {
    wood: { total: number; mdf: number; plywood: number; osb: number }
    plastic: { total: number; acrylic: number; polycarbonate: number; dibond: number }
    accessories: number
  }
}

export function AppShell({ children, stagedCount, materialCounts }: AppShellProps) {
  const [activeFilters, setActiveFilters] = useState<{
    category?: string
    typeFinish?: string
  }>({})

  return (
    <div className="min-w-[1280px]">
      <Sidebar
        stagedCount={stagedCount}
        materialCounts={materialCounts}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
      />
      <div className="ml-[240px] pt-12 min-h-screen bg-[#F7F7F5]">
        {children}
      </div>
    </div>
  )
}
