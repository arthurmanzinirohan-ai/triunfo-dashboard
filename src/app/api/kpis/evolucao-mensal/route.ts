import { NextRequest, NextResponse } from 'next/server'
import { getEvolucaoMensal } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const data = await getEvolucaoMensal({
      contrato: searchParams.get('contrato') ?? undefined,
      sigla:    searchParams.get('sigla')    ?? undefined,
      ano:      searchParams.get('ano')      ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/kpis/evolucao-mensal]', err)
    return NextResponse.json({ error: 'Erro ao buscar evolução mensal' }, { status: 500 })
  }
}
