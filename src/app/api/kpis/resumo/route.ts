import { NextRequest, NextResponse } from 'next/server'
import { getKpiResumo } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const data = await getKpiResumo({
      mes_ano:  searchParams.get('mes_ano')  ?? undefined,
      contrato: searchParams.get('contrato') ?? undefined,
      sigla:    searchParams.get('sigla')    ?? undefined,
      ano:      searchParams.get('ano')      ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/kpis/resumo]', err)
    return NextResponse.json({ error: 'Erro ao buscar KPI resumo' }, { status: 500 })
  }
}
