import { NextRequest, NextResponse } from 'next/server'
import { getKpisPorContrato } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const data = await getKpisPorContrato({
      mes_ano: searchParams.get('mes_ano') ?? undefined,
      ano:     searchParams.get('ano')     ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/kpis/por-contrato]', err)
    return NextResponse.json({ error: 'Erro ao buscar KPIs por contrato' }, { status: 500 })
  }
}
