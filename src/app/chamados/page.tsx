'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { getChamados, getFiltrosOpcoes } from '@/lib/api'
import type { Chamado, FiltrosOpcoes } from '@/types'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import clsx from 'clsx'

const STATUS_BADGE: Record<string, string> = {
  'FECHADO': 'badge-ok',
  'ABERTO': 'badge-danger',
  'EM ATENDIMENTO': 'badge-warn',
}

const TIPO_BADGE: Record<string, string> = {
  'FALHA': 'badge-danger',
  'DEFEITO': 'badge-info',
}

export default function ChamadosPage() {
  const [filtros, setFiltros] = useState<FiltrosOpcoes>({ contratos: [], siglas: [], meses_anos: [], anos: [] })
  const [selected, setSelected] = useState<{ mes_ano?: string; contrato?: string; sigla?: string; ano?: string }>({})
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const limit = 50

  const loadData = useCallback(async () => {
    const [ch, filt] = await Promise.all([
      getChamados({ ...selected, limit: String(limit), offset: String(page * limit) }),
      getFiltrosOpcoes(),
    ])
    const r = ch as any
    setChamados(r.data || [])
    setTotal(r.total || 0)
    setFiltros(filt as FiltrosOpcoes)
  }, [selected, page])

  useEffect(() => { loadData() }, [loadData])

  const filtered = search
    ? chamados.filter(c =>
        c.id_chamado?.toLowerCase().includes(search.toLowerCase()) ||
        c.equipamento?.toLowerCase().includes(search.toLowerCase()) ||
        c.descricao_chamado?.toLowerCase().includes(search.toLowerCase())
      )
    : chamados

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Chamados"
        filtros={filtros}
        selected={selected}
        onChange={(k, v) => { setSelected(prev => ({ ...prev, [k]: v || undefined })); setPage(0) }}
      />
      <div className="p-6 space-y-4">
        {/* Barra de busca */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, equipamento ou descrição..."
            className="w-full pl-9 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Tabela */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-hover border-b border-surface-border text-gray-500 uppercase text-[10px] tracking-wide">
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Equipamento</th>
                  <th className="text-left px-4 py-3">Contrato</th>
                  <th className="text-left px-4 py-3">Sistema</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3 max-w-xs">Descrição</th>
                  <th className="text-right px-4 py-3">Indisp.</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id_chamado || i}
                    className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5 text-primary-400 font-mono font-medium">{c.id_chamado}</td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{c.data_inicial}</td>
                    <td className="px-4 py-2.5 text-white whitespace-nowrap">{c.equipamento}</td>
                    <td className="px-4 py-2.5 text-gray-300">{c.contrato}</td>
                    <td className="px-4 py-2.5 text-gray-400">{c.sistema}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full',
                        TIPO_BADGE[c.tipo_ocorrencia] || 'badge-info')}>
                        {c.tipo_ocorrencia}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 max-w-xs truncate">{c.descricao_chamado}</td>
                    <td className="px-4 py-2.5 text-right text-gray-300 tabular-nums whitespace-nowrap">
                      {c.tempo_indisp_horas ? `${c.tempo_indisp_horas.toFixed(1)}h` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full',
                        STATUS_BADGE[c.status_chamado] || 'badge-info')}>
                        {c.status_chamado}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-600">Sem chamados para os filtros selecionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <span className="text-xs text-gray-500">
              {page * limit + 1}–{Math.min((page + 1) * limit, total)} de {total} chamados
            </span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-surface-hover disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-surface-hover disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
