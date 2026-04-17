import { NextRequest, NextResponse } from 'next/server'
import { getRankingEquipamentos } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limitParam = searchParams.get('limit')
    const data = await getRankingEquipamentos({
      contrato: searchParams.get('contrato') ?? undefined,
      limit:    limitParam ? parseInt(limitParam, 10) : 10,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/ranking/equipamentos]', err)
    return NextResponse.json({ error: 'Erro ao buscar ranking de equipamentos' }, { status: 500 })
  }
}
