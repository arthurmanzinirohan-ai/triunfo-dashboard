// API_URL vazio → usa rotas relativas Next.js (/api/...) sem servidor Python separado
const API_URL = ''

// Valores padrão por tipo de retorno
const DEFAULTS = {
  array: [] as any[],
  kpi: {
    total_chamados: 0, total_falhas: 0, total_defeitos: 0,
    chamados_fechados: 0, chamados_abertos: 0,
    mttr_horas: 0, mtbf_horas: 0, disponibilidade_pct: 0,
    total_horas_indisp: 0, meta_disponibilidade: 92,
  },
  filtros: { contratos: [], siglas: [], meses_anos: [], anos: [] },
  chamados: { data: [], total: 0, offset: 0, limit: 100 },
}

async function fetchJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback
    const data = await res.json()
    return data ?? fallback
  } catch {
    return fallback
  }
}

function buildParams(filters: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v) })
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

export async function getKPIResumo(filters: {
  mes_ano?: string; contrato?: string; sigla?: string; ano?: string
}) {
  return fetchJSON(`/api/kpis/resumo${buildParams(filters)}`, DEFAULTS.kpi)
}

export async function getEvolucaoMensal(filters: {
  contrato?: string; sigla?: string
}) {
  return fetchJSON(`/api/kpis/evolucao-mensal${buildParams(filters)}`, DEFAULTS.array)
}

export async function getKPIsPorContrato(mes_ano?: string) {
  return fetchJSON(`/api/kpis/por-contrato${buildParams({ mes_ano })}`, DEFAULTS.array)
}

export async function getOcorrenciasPorSistema(filters: {
  mes_ano?: string; contrato?: string
}) {
  return fetchJSON(`/api/ocorrencias/por-sistema${buildParams(filters)}`, DEFAULTS.array)
}

export async function getRankingEquipamentos(contrato?: string, limit = 10) {
  return fetchJSON(`/api/ranking/equipamentos${buildParams({ contrato, limit: String(limit) })}`, DEFAULTS.array)
}

export async function getFiltrosOpcoes() {
  return fetchJSON('/api/filtros/opcoes', DEFAULTS.filtros)
}

export async function getChamados(filters: {
  mes_ano?: string; contrato?: string; sigla?: string;
  status?: string; limit?: string; offset?: string
}) {
  return fetchJSON(`/api/chamados${buildParams(filters)}`, DEFAULTS.chamados)
}
