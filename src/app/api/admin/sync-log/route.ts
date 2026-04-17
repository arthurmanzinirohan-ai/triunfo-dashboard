export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Retorna array vazio (sem histórico de sync)
    // Em uma aplicação real, isso viria de um banco de dados
    const logs = []

    return Response.json(logs)
  } catch (e) {
    console.error('[/api/admin/sync-log]', e)
    return Response.json(
      { error: 'Erro ao buscar logs' },
      { status: 500 }
    )
  }
}
