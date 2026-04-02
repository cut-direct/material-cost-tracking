import { TopBar } from '@/components/layout/TopBar'
import { MaterialsTable } from '@/components/database/MaterialsTable'
import { getMaterials } from '@/lib/db/materials'
import type { Material } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DatabasePage() {
  let initialMaterials: Material[] = []
  try {
    initialMaterials = await getMaterials()
  } catch {
    // DB not yet configured — render empty state
  }

  return (
    <>
      <TopBar title="Material Database" />
      <main className="px-6 py-6">
        <MaterialsTable initialData={initialMaterials} />
      </main>
    </>
  )
}
