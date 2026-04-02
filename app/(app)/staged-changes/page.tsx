import { TopBar } from '@/components/layout/TopBar'
import { StagedChangesTable } from '@/components/staged-changes/StagedChangesTable'
import { getStagedChanges } from '@/lib/db/staged-changes'
import type { StagedChange } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StagedChangesPage() {
  let initialData: StagedChange[] = []
  try {
    initialData = await getStagedChanges()
  } catch {
    // DB not configured yet
  }

  return (
    <>
      <TopBar title="Staged Changes" />
      <main className="px-6 py-6">
        <div className="mb-4">
          <p className="text-[13px] text-gray-500">
            Future-dated price changes waiting to be applied. They are automatically committed at 06:00 UTC on their effective date.
          </p>
        </div>
        <StagedChangesTable initialData={initialData} />
      </main>
    </>
  )
}
