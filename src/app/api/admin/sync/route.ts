import { NextResponse } from 'next/server'
import { invalidateCache } from '@/lib/sheets-data'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    invalidateCache()
    return NextResponse.json({ ok: true, message: 'Cache invalidado com sucesso' })
  } catch (err) {
    console.error('[/api/admin/sync]', err)
    return NextResponse.json({ error: 'Erro ao invalidar cache' }, { status: 500 })
  }
}
