import { NextRequest, NextResponse } from 'next/server'
import { getOcorrenciasPorSistema } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const data = await getOcorrenciasPorSistema({
      mes_ano:  searchParams.get('mes_ano')  ?? undefined,
      contrato: searchParams.get('contrato') ?? undefined,
      ano:      searchParams.get('ano')      ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/ocorrencias/por-sistema]', err)
    return NextResponse.json({ error: 'Erro ao buscar ocorrências por sistema' }, { status: 500 })
  }
}
