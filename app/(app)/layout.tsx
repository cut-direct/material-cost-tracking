import type { ReactNode } from 'react'
import { AppShell } from './AppShell'
import { getStagedChanges } from '@/lib/db/staged-changes'
import { getMaterials } from '@/lib/db/materials'

async function getStagedCount() {
  try {
    const changes = await getStagedChanges()
    return changes.length
  } catch {
    return 0
  }
}

async function getMaterialCounts() {
  try {
    const materials = await getMaterials()
    const counts = {
      wood: { total: 0, mdf: 0, plywood: 0, osb: 0 },
      plastic: { total: 0, acrylic: 0, polycarbonate: 0, dibond: 0 },
      accessories: 0,
    }

    for (const m of materials) {
      const cat = m.category.toLowerCase()
      const tf = m.typeFinish.toLowerCase()

      if (cat === 'wood') {
        counts.wood.total++
        if (tf === 'mdf') counts.wood.mdf++
        else if (tf === 'plywood') counts.wood.plywood++
        else if (tf === 'osb') counts.wood.osb++
      } else if (cat === 'plastic') {
        counts.plastic.total++
        if (tf === 'acrylic') counts.plastic.acrylic++
        else if (tf === 'polycarbonate') counts.plastic.polycarbonate++
        else if (tf === 'dibond') counts.plastic.dibond++
      } else if (cat === 'accessories') {
        counts.accessories++
      }
    }

    return counts
  } catch {
    return undefined
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [stagedCount, materialCounts] = await Promise.all([
    getStagedCount(),
    getMaterialCounts(),
  ])

  return (
    <AppShell stagedCount={stagedCount} materialCounts={materialCounts}>
      {children}
    </AppShell>
  )
}
