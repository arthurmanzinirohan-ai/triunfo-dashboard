import { NextResponse } from 'next/server'
import { getFiltrosOpcoes } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getFiltrosOpcoes()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/filtros/opcoes]', err)
    return NextResponse.json({ error: 'Erro ao buscar filtros' }, { status: 500 })
  }
}
