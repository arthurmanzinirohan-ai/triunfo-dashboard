import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CSV_URL =
  process.env.SHEETS_URL ??
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTA-NhmgA6J9Tnhu_3yHfiOTVjuQ5f3O-31DKnBxYV_68Jpu5kbZcx4skQpvfyxZdAsRYf0zR-Wxql8/pub?gid=255383776&single=true&output=csv'

export async function GET() {
  try {
    const resp = await fetch(CSV_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: `HTTP ${resp.status}`, url: CSV_URL.slice(0, 80) })
    }

    const text = await resp.text()
    const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim())

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const row1 = lines[1]?.split(',').map(v => v.replace(/"/g, '').trim()) ?? []

    return NextResponse.json({
      ok: true,
      total_linhas: lines.length - 1,
      total_bytes: text.length,
      colunas: headers,
      primeira_linha: Object.fromEntries(headers.map((h, i) => [h, row1[i] ?? ''])),
      sheets_url_configurada: !!process.env.SHEETS_URL,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
