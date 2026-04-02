import { prisma } from './prisma'
import type { SupplierAlias } from '@/types'

function serializeAlias(a: {
  id: string
  rawText: string
  materialId: string
  supplierId: string | null
  createdAt: Date
}): SupplierAlias {
  return {
    id: a.id,
    rawText: a.rawText,
    materialId: a.materialId,
    supplierId: a.supplierId,
    createdAt: a.createdAt.toISOString(),
  }
}

export async function getAliases(): Promise<SupplierAlias[]> {
  const aliases = await prisma.supplierAlias.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return aliases.map(serializeAlias)
}

export async function saveAlias(
  rawText: string,
  materialId: string,
  supplierId?: string
): Promise<SupplierAlias> {
  const alias = await prisma.supplierAlias.upsert({
    where: { rawText },
    update: { materialId, supplierId: supplierId ?? null },
    create: { rawText, materialId, supplierId: supplierId ?? null },
  })
  return serializeAlias(alias)
}

/**
 * Given an array of raw text strings (product range names from emails),
 * return a map of rawText → materialId for any that have a known alias.
 */
export async function resolveAliases(rawTexts: string[]): Promise<Record<string, string>> {
  if (rawTexts.length === 0) return {}

  const aliases = await prisma.supplierAlias.findMany({
    where: {
      rawText: { in: rawTexts },
    },
  })

  const result: Record<string, string> = {}
  for (const alias of aliases) {
    result[alias.rawText] = alias.materialId
  }
  return result
}
