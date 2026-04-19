/**
 * sheets-data.ts
 * Busca dados do Google Sheets via CSV público, calcula KPIs.
 */

const CSV_URL =
  process.env.SHEETS_URL ??
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTA-NhmgA6J9Tnhu_3yHfiOTVjuQ5f3O-31DKnBxYV_68Jpu5kbZcx4skQpvfyxZdAsRYf0zR-Wxql8/pub?gid=255383776&single=true&output=csv'

const CACHE_TTL = 3600 * 1000 // 1 hora
const HH_MES = 730.0

// ── Cache singleton ──────────────────────────────────────────────────────────

interface CacheEntry { data: Row[] | null; ts: number }
const _g = globalThis as typeof globalThis & { __sheetsCache?: CacheEntry }
if (!_g.__sheetsCache) _g.__sheetsCache = { data: null, ts: 0 }
const _cache = _g.__sheetsCache

// ── Tipos ────────────────────────────────────────────────────────────────────

export type Row = Record<string, string>

// ── Normalização de colunas ──────────────────────────────────────────────────

function normKey(k: string): string {
  return k
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/º/g, 'O')              // ordinal masculino → O  (ex: Nº → NO)
    .replace(/ª/g, 'A')              // ordinal feminino → A
    .toUpperCase()
    .trim()
}

const COL_MAP: Record<string, string> = {
  'ID NO DO CHAMADO':           'ID_CHAMADO',
  'ID N DO CHAMADO':            'ID_CHAMADO',
  'NO DO CHAMADO':              'ID_CHAMADO',
  'N DO CHAMADO':               'ID_CHAMADO',
  'CHAMADO':                    'TIPO_CHAMADO',
  'DATA INICIAL':               'DATA_INICIAL',
  'ANO':                        'ANO',
  'MES':                        'MES',
  'MES ABREV.':                 'MES_ABREV',
  'MES ABREV':                  'MES_ABREV',
  'MES/ANO':                    'MES_ANO',
  'EQPTO':                      'EQPTO',
  'SIGLA':                      'SIGLA',
  'EQUIPAMENTO':                'EQUIPAMENTO',
  'CONTRATO':                   'CONTRATO',
  'LOCALIZACAO':                'LOCALIZACAO',
  'DEFEITO/FALHA?':             'TIPO_OCORRENCIA',
  'DEFEITO/FALHA':              'TIPO_OCORRENCIA',
  'DESCRICAO DO CHAMADO':       'DESCRICAO',
  'ATENDENTES':                 'ATENDENTES',
  'CAUSA':                      'CAUSA',
  'SISTEMA':                    'SISTEMA',
  'SERVICO REALIZADO':          'SERVICO',
  'STATUS DO CHAMADO':          'STATUS_CHAMADO',
  'STATUS':                     'STATUS_CHAMADO',
  'EQUIPAMENTO PARADO?':        'EQ_PARADO',
  'EQUIPAMENTO PARADO':         'EQ_PARADO',
  'TEMPO INDISP.':              'TEMPO_INDISP',
  'TEMPO INDISP':               'TEMPO_INDISP',
  'DATA FINAL':                 'DATA_FINAL',
  'HORA FIM':                   'HORA_FIM',
  'NUMERO CHAMADO AJUSTADO':    'ID_CHAMADO_ALT',
  'TIPO DEFEITO/FALHA':         'TIPO_OCORRENCIA',
  'HH - SALDO DISPONIVEL MES':  'HH_DISPONIVEL',
  'HH -  SALDO DISPONIVEL MES': 'HH_DISPONIVEL',
  'HH - SALDO DISPONAVEL MES':  'HH_DISPONIVEL',
  'HH -  SALDO DISPONAVEL MES': 'HH_DISPONIVEL',
  'HH SALDO DISPONIVEL MES':    'HH_DISPONIVEL',
  'HH SALDO DISPONAVEL MES':    'HH_DISPONIVEL',
  'FAMILIA':                    'FAMILIA',
  'DEFEITO':                    'DEFEITO',
  'F_DEFEITO/FALHA':            'F_TIPO_OCORRENCIA',
  'F_DEFEITO/FALHA?':           'F_TIPO_OCORRENCIA',
  'F_STATUS DO CHAMADO':        'F_STATUS_CHAMADO',
  'F_SISTEMA':                  'F_SISTEMA',
  'F_SISTEMA_5':                'F_SISTEMA',
  'F_FAMILIA':                  'F_FAMILIA',
  'F_ATENDENTES':               'F_ATENDENTES',
  'ABERTURA/FECHAMENTO':        'TIPO_MOVIMENTO',
  'TIPO DE MOVIMENTO':          'TIPO_MOVIMENTO',
}

// ── Parser CSV ───────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { result.push(field.trim()); field = '' }
      else field += c
    }
  }
  result.push(field.trim())
  return result
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const headers = parseLine(lines[0])
  const rows = lines.slice(1).filter(l => l.trim() !== '').map(parseLine)
  return { headers, rows }
}

// ── Fetch CSV ────────────────────────────────────────────────────────────────

export async function fetchRaw(): Promise<Row[]> {
  const now = Date.now()
  if (_cache.data !== null && now - _cache.ts < CACHE_TTL) {
    return _cache.data
  }

  const resp = await fetch(CSV_URL, { cache: 'no-store', signal: AbortSignal.timeout(30_000) })
  if (!resp.ok) throw new Error(`CSV fetch failed: ${resp.status}`)

  const text = await resp.text()
  const { headers, rows: csvRows } = parseCSV(text)

  const canonicalHeaders = headers.map(h => {
    const nk = normKey(h)
    return COL_MAP[nk] ?? nk
  })

  const result: Row[] = []
  for (const fields of csvRows) {
    const row: Row = {}
    for (let i = 0; i < canonicalHeaders.length; i++) {
      row[canonicalHeaders[i]] = fields[i] ?? ''
    }
    // aceita qualquer coluna de ID disponível
    if (!clean(row['ID_CHAMADO']) && !clean(row['ID_CHAMADO_ALT'])) continue
    if (!clean(row['ID_CHAMADO'])) row['ID_CHAMADO'] = row['ID_CHAMADO_ALT'] ?? ''
    result.push(row)
  }

  _cache.data = result
  _cache.ts = now
  return result
}

export function invalidateCache(): void {
  _cache.data = null
  _cache.ts = 0
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function clean(val: string | undefined | null): string | null {
  if (val == null) return null
  const v = String(val).trim()
  return v === '' || v === 'nan' || v === 'None' ? null : v
}

export function num(val: string | undefined | null, maxValue?: number): number | null {
  const v = clean(val)
  if (!v) return null
  const n = parseFloat(v.replace(',', '.').replace(/\s/g, ''))
  if (isNaN(n)) return null
  if (maxValue !== undefined && n > maxValue) return null
  return n
}

// ── KPI Resumo ───────────────────────────────────────────────────────────────

export interface KPIResumo {
  total_chamados: number
  total_falhas: number
  total_defeitos: number
  chamados_fechados: number
  chamados_abertos: number
  mttr_horas: number
  mtbf_horas: number
  disponibilidade_pct: number
  total_horas_indisp: number
  meta_disponibilidade: number
}

export async function getKpiResumo(filters: {
  mes_ano?: string; contrato?: string; sigla?: string; ano?: string
}): Promise<KPIResumo> {
  let rows = await fetchRaw()
  if (filters.mes_ano)  rows = rows.filter(r => clean(r['MES_ANO'])  === filters.mes_ano)
  if (filters.contrato) rows = rows.filter(r => clean(r['CONTRATO']) === filters.contrato)
  if (filters.sigla)    rows = rows.filter(r => clean(r['SIGLA'])    === filters.sigla)
  if (filters.ano)      rows = rows.filter(r => clean(r['ANO'])      === filters.ano)

  const total    = rows.length
  const falhas   = rows.filter(r => clean(r['TIPO_OCORRENCIA']) === 'FALHA').length
  const defeitos = rows.filter(r => clean(r['TIPO_OCORRENCIA']) === 'DEFEITO').length
  const fechados = rows.filter(r => clean(r['STATUS_CHAMADO'])  === 'FECHADO').length

  const rowsFechados = rows.filter(r => clean(r['STATUS_CHAMADO']) === 'FECHADO')
  const indispFechados = rowsFechados
    .map(r => num(r['TEMPO_INDISP'], 1000))
    .filter((v): v is number => v !== null)

  const totalIndispFechados = indispFechados.reduce((a, b) => a + b, 0)
  const mttr = rowsFechados.length > 0 ? round2(totalIndispFechados / rowsFechados.length) : 0

  const falhasFechadas = rowsFechados.filter(r => clean(r['TIPO_OCORRENCIA']) === 'FALHA').length
  const mtbf = falhasFechadas > 0 ? round2(totalIndispFechados / falhasFechadas) : 0

  const eqptoPeriodo = new Map<string, number>()
  for (const r of rowsFechados) {
    const key = `${clean(r['EQPTO']) ?? '?'}|${clean(r['MES_ANO']) ?? '?'}`
    const v = num(r['TEMPO_INDISP'], 1000)
    if (v !== null) eqptoPeriodo.set(key, (eqptoPeriodo.get(key) ?? 0) + v)
  }

  const dispVals = Array.from(eqptoPeriodo.values()).map(
    indisp => Math.max(0, ((HH_MES - indisp) / HH_MES) * 100)
  )
  const disp = dispVals.length > 0
    ? round2(dispVals.reduce((a, b) => a + b, 0) / dispVals.length) : 0

  return {
    total_chamados: total,
    total_falhas: falhas,
    total_defeitos: defeitos,
    chamados_fechados: fechados,
    chamados_abertos: total - fechados,
    mttr_horas: mttr,
    mtbf_horas: mtbf,
    disponibilidade_pct: disp,
    total_horas_indisp: round2(totalIndispFechados),
    meta_disponibilidade: 92,
  }
}

// ── Evolução Mensal ──────────────────────────────────────────────────────────

interface MensalGroup {
  mes_ano: string; mes: number; ano: number; contrato: string; sigla: string
  total_chamados: number; total_falhas: number; total_defeitos: number
  chamados_fechados: number; chamados_abertos: number; _i: number[]; _h: number[]
}

function buildMensalGroup(rows: Row[]): Map<string, MensalGroup> {
  const grouped = new Map<string, MensalGroup>()
  for (const r of rows) {
    const key = clean(r['MES_ANO']) ?? '?'
    if (!grouped.has(key)) {
      const mes = clean(r['MES']) ?? '0'
      const ano = clean(r['ANO']) ?? '0'
      grouped.set(key, {
        mes_ano: key,
        mes: /^\d+$/.test(mes) ? parseInt(mes) : 0,
        ano: /^\d+$/.test(ano) ? parseInt(ano) : 0,
        contrato: clean(r['CONTRATO']) ?? '',
        sigla:    clean(r['SIGLA'])    ?? '',
        total_chamados: 0, total_falhas: 0, total_defeitos: 0,
        chamados_fechados: 0, chamados_abertos: 0, _i: [], _h: [],
      })
    }
    const g = grouped.get(key)!
    g.total_chamados++
    const tipo = clean(r['TIPO_OCORRENCIA']) ?? ''
    if (tipo === 'FALHA')   g.total_falhas++
    if (tipo === 'DEFEITO') g.total_defeitos++
    if (clean(r['STATUS_CHAMADO']) === 'FECHADO') g.chamados_fechados++
    else g.chamados_abertos++
    const v = num(r['TEMPO_INDISP'], 1000)
    if (v !== null) g._i.push(v)
    const h = num(r['HH_DISPONIVEL'])
    if (h !== null) g._h.push(h)
  }
  return grouped
}

function finalizeGroup(g: MensalGroup) {
  const totalInd = g._i.reduce((a, b) => a + b, 0)
  const hhMax    = g._h.length > 0 ? Math.max(...g._h) : 0
  const { _i, _h, ...rest } = g
  void _i; void _h
  return {
    ...rest,
    total_horas_indisp:  round2(totalInd),
    hh_disponivel_mes:   hhMax,
    mttr_horas:          g._i.length > 0 ? round2(totalInd / g._i.length) : 0,
    mtbf_horas:          rest.total_falhas > 0 && hhMax > 0
      ? round2((hhMax - totalInd) / rest.total_falhas) : 0,
    disponibilidade_pct: hhMax > 0
      ? round2(((hhMax - totalInd) / hhMax) * 100) : 0,
  }
}

export async function getEvolucaoMensal(filters: {
  contrato?: string; sigla?: string; ano?: string
}) {
  let rows = await fetchRaw()
  if (filters.contrato) rows = rows.filter(r => clean(r['CONTRATO']) === filters.contrato)
  if (filters.sigla)    rows = rows.filter(r => clean(r['SIGLA'])    === filters.sigla)
  if (filters.ano)      rows = rows.filter(r => clean(r['ANO'])      === filters.ano)

  const grouped = buildMensalGroup(rows)
  return Array.from(grouped.values())
    .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes)
    .map(finalizeGroup)
}

// ── KPIs por Contrato ────────────────────────────────────────────────────────

export async function getKpisPorContrato(filters: { mes_ano?: string; ano?: string }) {
  let rows = await fetchRaw()
  if (filters.mes_ano) rows = rows.filter(r => clean(r['MES_ANO']) === filters.mes_ano)
  if (filters.ano)     rows = rows.filter(r => clean(r['ANO'])     === filters.ano)

  const grouped = new Map<string, MensalGroup & { mes_ano: string; contrato: string }>()
  for (const r of rows) {
    const contrato = clean(r['CONTRATO']) ?? '?'
    const mesAno   = clean(r['MES_ANO'])  ?? '?'
    const key      = `${contrato}|${mesAno}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        mes_ano: mesAno, contrato,
        sigla: clean(r['SIGLA']) ?? '', mes: 0, ano: 0,
        total_chamados: 0, total_falhas: 0, total_defeitos: 0,
        chamados_fechados: 0, chamados_abertos: 0, _i: [], _h: [],
      })
    }
    const g = grouped.get(key)!
    g.total_chamados++
    const tipo = clean(r['TIPO_OCORRENCIA']) ?? ''
    if (tipo === 'FALHA')   g.total_falhas++
    if (tipo === 'DEFEITO') g.total_defeitos++
    if (clean(r['STATUS_CHAMADO']) === 'FECHADO') g.chamados_fechados++
    else g.chamados_abertos++
    const v = num(r['TEMPO_INDISP'], 1000)
    if (v !== null) g._i.push(v)
    const h = num(r['HH_DISPONIVEL'])
    if (h !== null) g._h.push(h)
  }
  return Array.from(grouped.values()).map(finalizeGroup)
}

// ── Ocorrências por Sistema ──────────────────────────────────────────────────

export async function getOcorrenciasPorSistema(filters: {
  mes_ano?: string; contrato?: string; ano?: string
}) {
  let rows = await fetchRaw()
  if (filters.mes_ano)  rows = rows.filter(r => clean(r['MES_ANO'])  === filters.mes_ano)
  if (filters.contrato) rows = rows.filter(r => clean(r['CONTRATO']) === filters.contrato)
  if (filters.ano)      rows = rows.filter(r => clean(r['ANO'])      === filters.ano)

  interface SistemaGroup {
    mes_ano: string; contrato: string; sistema: string
    tipo_ocorrencia: string; total: number; _i: number[]
  }
  const grouped = new Map<string, SistemaGroup>()
  for (const r of rows) {
    const sistema  = clean(r['SISTEMA']) ?? clean(r['F_SISTEMA']) ?? 'NAO INFORMADO'
    const tipo     = clean(r['TIPO_OCORRENCIA']) ?? clean(r['F_TIPO_OCORRENCIA']) ?? '?'
    const mesAno   = clean(r['MES_ANO'])   ?? '?'
    const contrato = clean(r['CONTRATO'])  ?? '?'
    const key = `${sistema}|${tipo}|${mesAno}|${contrato}`
    if (!grouped.has(key)) {
      grouped.set(key, { mes_ano: mesAno, contrato, sistema, tipo_ocorrencia: tipo, total: 0, _i: [] })
    }
    const g = grouped.get(key)!
    g.total++
    const v = num(r['TEMPO_INDISP'])
    if (v !== null) g._i.push(v)
  }

  return Array.from(grouped.values())
    .map(g => {
      const { _i, ...rest } = g
      return { ...rest, media_indisp_horas: _i.length > 0 ? round2(_i.reduce((a, b) => a + b, 0) / _i.length) : 0 }
    })
    .sort((a, b) => b.total - a.total)
}

// ── Ranking Equipamentos ─────────────────────────────────────────────────────

export async function getRankingEquipamentos(filters: { contrato?: string; limit?: number }) {
  let rows = await fetchRaw()
  if (filters.contrato) rows = rows.filter(r => clean(r['CONTRATO']) === filters.contrato)

  interface EqptoGroup {
    eqpto_codigo: string; sigla: string; equipamento: string
    contrato: string; total_chamados: number; total_falhas: number; _i: number[]
  }
  const grouped = new Map<string, EqptoGroup>()
  for (const r of rows) {
    const codigo = clean(r['EQPTO']) ?? '?'
    if (!grouped.has(codigo)) {
      grouped.set(codigo, {
        eqpto_codigo: codigo,
        sigla:       clean(r['SIGLA'])       ?? '',
        equipamento: clean(r['EQUIPAMENTO']) ?? '',
        contrato:    clean(r['CONTRATO'])    ?? '',
        total_chamados: 0, total_falhas: 0, _i: [],
      })
    }
    const g = grouped.get(codigo)!
    g.total_chamados++
    if (clean(r['TIPO_OCORRENCIA']) === 'FALHA') g.total_falhas++
    const v = num(r['TEMPO_INDISP'])
    if (v !== null) g._i.push(v)
  }

  const limit = filters.limit ?? 10
  return Array.from(grouped.values())
    .map(g => {
      const { _i, ...rest } = g
      const total = _i.reduce((a, b) => a + b, 0)
      return { ...rest, total_horas_indisp: round2(total), mttr_medio: _i.length > 0 ? round2(total / _i.length) : 0 }
    })
    .sort((a, b) => b.total_chamados - a.total_chamados)
    .slice(0, limit)
}

// ── Filtros ──────────────────────────────────────────────────────────────────

export async function getFiltrosOpcoes() {
  const rows = await fetchRaw()
  const set = <T>(fn: (r: Row) => T | null) =>
    Array.from(new Set(rows.map(fn).filter((v): v is T => v !== null))).sort()
  return {
    contratos:  set(r => clean(r['CONTRATO'])),
    siglas:     set(r => clean(r['SIGLA'])),
    meses_anos: set(r => clean(r['MES_ANO'])),
    anos:       set(r => clean(r['ANO'])),
  }
}

// ── Chamados ─────────────────────────────────────────────────────────────────

export async function getChamados(filters: {
  mes_ano?: string; contrato?: string; sigla?: string
  status?: string; ano?: string; limit?: number; offset?: number
}) {
  let rows = await fetchRaw()
  if (filters.mes_ano)  rows = rows.filter(r => clean(r['MES_ANO'])       === filters.mes_ano)
  if (filters.contrato) rows = rows.filter(r => clean(r['CONTRATO'])      === filters.contrato)
  if (filters.sigla)    rows = rows.filter(r => clean(r['SIGLA'])         === filters.sigla)
  if (filters.status)   rows = rows.filter(r => clean(r['STATUS_CHAMADO']) === filters.status)
  if (filters.ano)      rows = rows.filter(r => clean(r['ANO'])           === filters.ano)

  const total  = rows.length
  const limit  = filters.limit  ?? 100
  const offset = filters.offset ?? 0

  const data = rows.slice(offset, offset + limit).map(r => ({
    id_chamado:         clean(r['ID_CHAMADO']),
    data_inicial:       clean(r['DATA_INICIAL']),
    equipamento:        clean(r['EQUIPAMENTO']),
    sigla:              clean(r['SIGLA']),
    contrato:           clean(r['CONTRATO']),
    tipo_ocorrencia:    clean(r['TIPO_OCORRENCIA']),
    descricao_chamado:  clean(r['DESCRICAO']),
    sistema:            clean(r['SISTEMA']),
    status_chamado:     clean(r['STATUS_CHAMADO']),
    tempo_indisp_horas: num(r['TEMPO_INDISP'], 1000),
    mes_ano:            clean(r['MES_ANO']),
    atendentes:         clean(r['ATENDENTES']),
  }))

  return { data, total, offset, limit }
}

// ── Util ─────────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
