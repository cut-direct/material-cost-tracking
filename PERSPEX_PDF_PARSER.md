# Perspex PDF Parser — Context & Implementation Notes

> Created: 2026-04-03. Refer back to this before building the Perspex PDF upload feature.

## What this is

James Latham sends line-item quotations (one product per row). Perspex Distribution Ltd sends a
**price matrix** — a 2D grid where rows are sheet sizes and columns are thicknesses. These are
fundamentally different structures requiring different parsers.

## PDF Structure (from `Make It UK.pdf`)

The Perspex quote is a multi-page rate card. Each page covers a product group:

| Page | Product Group |
|------|--------------|
| 1 | Perspex Cast Sheet — Standard Gloss |
| 2 | Perspex Cast Block — Standard |
| 3 | Perspex Cast Sheet — Silk |
| 4 | Perspex Cast Sheet — Frost |
| 5 | Fluorescent, Pearlescent, Vario, Spectrum, Duo, Impressions |
| 6 | Perspex Extruded Sheet (inc. Impact, Mirror, Anti-Glare, Prismatic) |
| 7 | Polycarbonate UV2 |
| 8 | PETG, PET, PET AR, PETR-R |

### Within each page, structure is:

```
PRODUCT GROUP HEADING
  SUB-TYPE (e.g. CLEAR, OPAL, COLOUR, GLASS LOOK 6T21)
    Sheet Size Row 1    [price col 1] [price col 2] ... [price col N]
    Sheet Size Row 2    [price col 1] [price col 2] ...
    Price per m2        [£/m² col 1]  [£/m² col 2] ...
  SUB-TYPE ...
```

Thickness columns are defined in the header row of each table (e.g. 1mm, 1.5mm, 2mm … 25mm).
`POA` / `poa` = Price on Application — skip these cells.

### Example (Cast Sheet Standard Gloss, Clear):

| Size | 3mm | 4mm | 5mm | 6mm | ... |
|------|-----|-----|-----|-----|-----|
| 3050x2030 | 97.36 | 129.81 | 162.26 | 194.71 | ... |
| 2030x1525 | 48.68 | 64.90 | 81.13 | 97.36 | ... |
| Price/m² | 15.72 | 20.97 | 26.21 | 31.45 | ... |

## Mapping Perspex Names → DB Names

| Perspex PDF name | DB variant type / description contains |
|-----------------|--------------------------------------|
| Cast Sheet — Standard Gloss / CLEAR | Clear Acrylic (Standard / Gloss) |
| Cast Sheet — Standard Gloss / OPAL | Opal Acrylic / White Opal |
| Cast Sheet — Standard Gloss / GLASS LOOK 6T21 | Glass Look Acrylic |
| Cast Sheet — Standard Gloss / COLOUR | Coloured Acrylic (ALL colours share same price) |
| Cast Sheet — Silk / CLEAR SILK | Clear Acrylic (Silk) |
| Cast Sheet — Silk / OPAL SILK | Opal Acrylic (Silk) |
| Cast Sheet — Silk / SILK COLOUR | Coloured Acrylic (Silk) |
| Cast Sheet — Frost / CLEAR FROST | Frosted Acrylic / Clear Frost |
| Cast Sheet — Frost / OPAL FROST | Opal Frost Acrylic |
| Cast Sheet — Frost / COLOUR FROST | Coloured Frost Acrylic |
| Cast Block — Standard / CLEAR | Clear Acrylic (Block / Cast Block) |
| Fluorescents / Sparkle & Highlights | Fluorescent Acrylic |
| Anti-Reflective Fluorescents | Anti-Reflective / AR Acrylic |
| Pearlescents | Pearlescent Acrylic |
| VARIO | Vario Acrylic |
| Spectrum 1T77 | Spectrum Acrylic |
| Impressions | Impressions Acrylic |
| Duo | Duo Acrylic |
| Extruded Sheet / CLEAR (0X00) | Clear Acrylic (Extruded) |
| Extruded Sheet / IMPACT IM50 | Impact Acrylic IM50 |
| Extruded Sheet / IMPACT IM30 | Impact Acrylic IM30 |
| Extruded Sheet / ANTI-GLARE | Anti-Glare Acrylic |
| Extruded Sheet / OPAL 1X50 | Opal Acrylic (Extruded) |
| Extruded Sheet / WHITE 1X69 | White Acrylic (Extruded) |
| Extruded Sheet / BLACK 9X61 | Black Acrylic (Extruded) |
| Extruded Sheet / SILVER MIRROR | Silver Mirror Acrylic |
| Extruded Sheet / GOLD MIRROR | Gold Mirror Acrylic |
| Extruded Sheet / PRISMATIC K12 | Prismatic Acrylic |
| Polycarbonate UV2 / CLEAR | Clear Polycarbonate |
| Polycarbonate UV2 / HARD COAT | Hard Coat Polycarbonate |
| Polycarbonate UV2 / EMBOSSED CLEAR | Embossed Polycarbonate |
| Polycarbonate UV2 / OPAL (UV2) | Opal Polycarbonate |
| Polycarbonate UV2 / PRISMATIC K12 | Prismatic Polycarbonate |
| Polycarbonate UV2 / Diffused / Bronze / Solar Grey | Diffused / Bronze / Solar Grey Polycarbonate |
| PETG / CLEAR | Clear PETG |
| PET | PET |
| PET AR | Anti-Reflective PET |
| PETR-R | Recycled PETG / PETR |

This mapping table should be hardcoded in the parser — **not** fuzzy matched — since the naming
conventions are too different for fuzzy matching to be reliable.

## Key Implementation Decision: `COLOUR` category

`COLOUR` is NOT a specific colour. It is a pricing category meaning "any standard solid colour".
All coloured variants (Red, Blue, Yellow, Green, etc.) share the same price for a given thickness.

**Implication**: uploading a Perspex PDF triggers a **bulk category update**, not one-to-one matching.
The parser should:
1. Identify the sub-type as "COLOUR"
2. Find ALL DB materials whose `variantType` matches "Coloured Acrylic" (or equivalent)
3. For each matching thickness, update all matching colour variants to the new price

## Sheet Size to Use

**Almost always 3050 x 2030** — this is the standard full sheet size in the DB.
The `Price per m²` row is the most reliable anchor if you need to derive prices for other sizes:

```
pricePerSheet = pricePerM2 × (widthMm / 1000) × (heightMm / 1000)
```

For 3050 x 2030: `pricePerSheet = pricePerM2 × 3.050 × 2.030 = pricePerM2 × 6.1915`

## Proposed Build Approach

### UX: Category Mapper (NOT line-by-line review)

Unlike Lathams (line items → individual materials), Perspex should use a **category mapping UI**:

1. Upload PDF → extract price matrix into structured JSON
2. Show a table: each sub-type (e.g. "Cast Gloss Clear", "Cast Gloss Colour") × thickness
3. Show the extracted price per m² and the calculated per-sheet price (3050×2030)
4. For each row, show which DB materials will be updated (grouped by variantType)
5. User confirms/unchecks rows, then bulk-stages the updates

### Extraction via Claude API

Send the PDF as a base64 document to `claude-sonnet-4-6`. Use tool use to extract:

```json
{
  "productGroups": [
    {
      "groupName": "Cast Sheet Standard Gloss",
      "subType": "CLEAR",
      "entries": [
        { "thicknessMm": 3, "sheetSize": "3050x2030", "pricePerSheet": 97.36, "pricePerM2": 15.72 },
        { "thicknessMm": 4, "sheetSize": "3050x2030", "pricePerSheet": 129.81, "pricePerM2": 20.97 }
      ]
    }
  ]
}
```

### Matching strategy

1. Use the hardcoded mapping table (above) to resolve `groupName + subType` → DB `variantType`
2. Filter DB materials by `variantType` match + exact `thicknessMm`
3. Use `pricePerSheet` for 3050×2030 as the new `costPerSheet`
4. If DB has a different size recorded, derive from `pricePerM2 × (width/1000) × (height/1000)`

### Files to create (when building)

- `lib/ai/perspex-parser.ts` — PDF extraction + category matching
- `app/api/parse-pdf-perspex/route.ts` — multipart PDF upload endpoint
- `components/price-updates/PerspexUploadPanel.tsx` — category mapper UI (separate from ReviewTable)
- Update `components/price-updates/PriceUpdateTool.tsx` — add "Perspex PDF" tab

### Supplier in DB

Supplier name is likely stored as `"Perspex"` or `"Perspex Distribution"` — verify before building.
The PDF footer says: **Perspex Distribution Ltd, Chelmsford, Essex**.
