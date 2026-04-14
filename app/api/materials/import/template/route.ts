import { NextResponse } from 'next/server'

const TEMPLATE_CSV = `entity_id,name,sku,category,material,variant_type,thickness,cost,cost_length,cost_width,supplier
10001,Kronospan White Gloss 18mm MDF,cts-18-mdf-kronospan-white-gloss,Wood,MDF,Kronospan,18,42.50,1220,2440,Kronospan
10002,Cast Clear Acrylic 10mm,cts-10-acrylic-cast-clear,Plastic,Acrylic,FINSA 12Twenty,10,85.00,1520,2050,Perspex Solutions
`

export async function GET() {
  return new NextResponse(TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="import-template.csv"',
    },
  })
}

