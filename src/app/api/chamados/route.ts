import { NextRequest, NextResponse } from 'next/server'
import { getChamados } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limitParam  = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const data = await getChamados({
      mes_ano:  searchParams.get('mes_ano')  ?? undefined,
      contrato: searchParams.get('contrato') ?? undefined,
      sigla:    searchParams.get('sigla')    ?? undefined,
      status:   searchParams.get('status')   ?? undefined,
      ano:      searchParams.get('ano')      ?? undefined,
      limit:    limitParam  ? parseInt(limitParam,  10) : 100,
      offset:   offsetParam ? parseInt(offsetParam, 10) : 0,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/chamados]', err)
    return NextResponse.json({ error: 'Erro ao buscar chamados' }, { status: 500 })
  }
}
