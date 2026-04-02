import { TopBar } from '@/components/layout/TopBar'
import { PriceUpdateTool } from '@/components/price-updates/PriceUpdateTool'

export default function PriceUpdatesPage() {
  return (
    <>
      <TopBar title="Price Updates" />
      <main className="px-6 py-6">
        <PriceUpdateTool />
      </main>
    </>
  )
}
