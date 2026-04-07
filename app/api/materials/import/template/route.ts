import { NextResponse } from 'next/server'

const TEMPLATE_CSV = `magento_sku,magento_name,magento_entity_id,category,type_finish,description,thickness_mm,width_mm,height_mm,cost_per_sheet,markup_multiplier,supplier,variant_type
cts-18-mdf-kronospan-white-gloss,Kronospan White Gloss 18mm MDF,10001,Wood,MDF,Kronospan White Gloss,18,2440,1220,42.50,1.45,Kronospan,Kronospan
cts-10-acrylic-cast-clear,Cast Clear Acrylic 10mm,10002,Plastic,Acrylic,Cast Clear,10,2050,1520,85.00,1.55,Perspex Solutions,FINSA 12Twenty
`

export async function GET(): Promise<NextResponse> {
  return new NextResponse(TEMPLATE_CSV, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="material-import-template.csv"',
    },
  })
}
