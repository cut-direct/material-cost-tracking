// One-off fix script — run with: node scripts/fix-competitor-prices.mjs
//
// Does two things:
//  1. Nullifies the incorrect £10.00 price for Sheet Plastics / 4mm Clear Acrylic
//     (the scraper pulled a wrong value; the correct price was £21.99 from the prior run)
//  2. Backfills all Plastic Sheet Shop historical prices so every run matches
//     the latest scraped price per basket item — removing bad deltas caused by
//     previously incorrect scrapes.

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* skip */ }
}

loadEnv(resolve(root, '.env.local'))
loadEnv(resolve(root, '.env'))

const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient()

// ─── 1. Fix Sheet Plastics — 4mm Clear Acrylic ────────────────────────────────
// The latest run recorded £10.00 for this item which is clearly wrong (-68.7%).
// Null out price_per_m2 and price_gbp on that run so the previous valid price
// becomes the current price and no delta is shown.

console.log('\n── Fix 1: Sheet Plastics / 4mm Clear Acrylic ──────────────────')

// Find the basket item
const acrylic4mm = await prisma.competitorBasketItem.findFirst({
  where: {
    category: 'Plastic',
    name: { contains: '4mm', mode: 'insensitive' },
    thicknessMm: 4,
  },
})

if (!acrylic4mm) {
  console.error('  Could not find 4mm Clear Acrylic basket item — check name/thickness')
} else {
  console.log(`  Basket item: "${acrylic4mm.name}" (id ${acrylic4mm.id})`)

  // Find the offending record: the most recent sheet-plastics price for this item
  // that is suspiciously low (< £15/m²).  We identify it by its run rather than
  // hard-coding an ID so the fix is idempotent if re-run.
  const badRows = await prisma.$queryRaw`
    SELECT cp.id, cp.price_per_m2, cp.price_gbp, cr.run_at
    FROM competitor_prices cp
    JOIN competitor_runs cr ON cp.run_id = cr.id
    WHERE cr.competitor = 'sheet-plastics'
      AND cp.basket_item_id = ${acrylic4mm.id}
      AND cp.price_per_m2 < 15
    ORDER BY cr.run_at DESC
  `

  if (!badRows.length) {
    console.log('  No suspicious low prices found — already fixed or never written.')
  } else {
    for (const row of badRows) {
      console.log(`  Nullifying price_per_m2=${row.price_per_m2}, price_gbp=${row.price_gbp} (run_at ${row.run_at})`)
      await prisma.$executeRaw`
        UPDATE competitor_prices
        SET price_per_m2 = NULL, price_gbp = NULL, raw_value = NULL
        WHERE id = ${row.id}
      `
    }
    console.log(`  Done — ${badRows.length} record(s) nullified.`)
  }
}

// ─── 2. Backfill Plastic Sheet Shop historical prices ─────────────────────────
// The scraper was pulling incorrect prices in past runs for this competitor.
// Strategy: for every basket item, find the price_per_m2 from the most recent run
// and overwrite all older runs' prices to that same value.
// This makes the "previous week" price equal the current price, so delta = 0.

console.log('\n── Fix 2: Backfill Plastic Sheet Shop historical prices ────────')

const pssItems = await prisma.$queryRaw`
  SELECT DISTINCT cp.basket_item_id
  FROM competitor_prices cp
  JOIN competitor_runs cr ON cp.run_id = cr.id
  WHERE cr.competitor = 'plastic-sheet-shop'
    AND cr.status IN ('success', 'partial')
    AND cp.price_per_m2 IS NOT NULL
`

console.log(`  Found ${pssItems.length} basket item(s) with Plastic Sheet Shop prices.`)

let totalUpdated = 0

for (const { basket_item_id } of pssItems) {
  // Get the latest price for this basket item
  const [latest] = await prisma.$queryRaw`
    SELECT cp.price_per_m2, cp.price_gbp, cr.run_at, cp.id AS price_id
    FROM competitor_prices cp
    JOIN competitor_runs cr ON cp.run_id = cr.id
    WHERE cr.competitor = 'plastic-sheet-shop'
      AND cr.status IN ('success', 'partial')
      AND cp.basket_item_id = ${basket_item_id}
      AND cp.price_per_m2 IS NOT NULL
    ORDER BY cr.run_at DESC
    LIMIT 1
  `

  if (!latest) continue

  // Update all older records for this basket item to match the latest price
  const result = await prisma.$executeRaw`
    UPDATE competitor_prices cp
    SET
      price_per_m2 = ${latest.price_per_m2},
      price_gbp    = ${latest.price_gbp}
    FROM competitor_runs cr
    WHERE cp.run_id = cr.id
      AND cr.competitor = 'plastic-sheet-shop'
      AND cp.basket_item_id = ${basket_item_id}
      AND cp.id != ${latest.price_id}
  `

  totalUpdated += result
  console.log(
    `  Basket item ${basket_item_id}: latest price/m² = ${latest.price_per_m2}, ` +
    `backfilled ${result} older record(s).`
  )
}

console.log(`\n  Done — ${totalUpdated} historical record(s) updated across all basket items.`)

await prisma.$disconnect()
console.log('\nAll fixes applied successfully.\n')
