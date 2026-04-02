const RANGE_STOP_WORDS = new Set([
  'all', 'products', 'product', 'range', 'ranges', 'items', 'item',
  'excl', 'except', 'excluding', 'exception', 'including', 'inclusive',
  'and', 'the', 'with', 'without', 'other', 'new', 'standard', 'our',
  'price', 'prices', 'increase', 'decrease', 'update', 'change',
])

const MATERIAL_NOUNS = new Set([
  'acrylic', 'polycarbonate', 'poly', 'mdf', 'plywood', 'ply', 'osb',
  'foam', 'pvc', 'dibond', 'acm', 'chipboard', 'mfc', 'timber'
])

function fuzzyScore(rangeName: string, materialDescription: string): number {
  const range = rangeName.toLowerCase()
  const desc = materialDescription.toLowerCase()

  if (desc.includes(range) || range.includes(desc)) return 0.9

  const rangeWords = range
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 2 && !RANGE_STOP_WORDS.has(w))
  const descWords = desc.split(/\s+/).filter((w) => w.length > 2)
  if (rangeWords.length === 0) return 0

  const requiredNouns = rangeWords.filter((w) => MATERIAL_NOUNS.has(w))
  for (const noun of requiredNouns) {
    if (!descWords.some((d) => d.includes(noun) || noun.includes(d))) {
      return 0 // Total mismatch on a core material type
    }
  }

  const matches = rangeWords.filter((w) => descWords.some((d) => d.includes(w) || w.includes(d)))
  return matches.length / rangeWords.length
}

console.log('Test 1: Clear Polycarbonate vs Acrylic (should be 0)')
console.log('Score:', fuzzyScore('3 and 5 mm clear acrylic', '3mm Clear Polycarbonate'))
console.log('Score:', fuzzyScore('clear acrylic', '3mm Clear Polycarbonate'))

console.log('\nTest 2: Clear Acrylic vs Acrylic (should be >0.6)')
console.log('Score:', fuzzyScore('3 and 5 mm clear acrylic', '5mm Clear Acrylic'))
