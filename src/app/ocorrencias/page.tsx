'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import OcorrenciasSistemaChart from '@/components/dashboard/OcorrenciasSistemaChart'
import KPICard from '@/components/dashboard/KPICard'
import { getKPIResumo, getOcorrenciasPorSistema, getFiltrosOpcoes } from '@/lib/api'
import type { KPIResumo, OcorrenciaSistema, FiltrosOpcoes } from '@/types'
import { AlertTriangle, Wrench, ShieldAlert } from 'lucide-react'

export default function OcorrenciasPage() {
  const [filtros, setFiltros] = useState<FiltrosOpcoes>({ contratos: [], siglas: [], meses_anos: [], anos: [] })
  const [selected, setSelected] = useState<{ mes_ano?: string; contrato?: string; sigla?: string }>({})
  const [kpi, setKpi] = useState<KPIResumo | null>(null)
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaSistema[]>([])

  const loadData = useCallback(async () => {
    const [k, oc, filt] = await Promise.all([
      getKPIResumo(selected),
      getOcorrenciasPorSistema({ mes_ano: selected.mes_ano, contrato: selected.contrato }),
      getFiltrosOpcoes(),
    ])
    setKpi(k as KPIResumo)
    setOcorrencias(oc as OcorrenciaSistema[])
    setFiltros(filt as FiltrosOpcoes)
  }, [selected])

  useEffect(() => { loadData() }, [loadData])

  // Taxa de fechamento
  const taxaFechamento = kpi && kpi.total_chamados > 0
    ? ((kpi.chamados_fechados / kpi.total_chamados) * 100).toFixed(1)
    : '—'

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Ocorrências — Defeitos e Falhas"
        filtros={filtros}
        selected={selected}
        onChange={(k, v) => setSelected(prev => ({ ...prev, [k]: v || undefined }))}
      />
      <div className="p-6 space-y-6">
        {/* KPI Cards SMS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Ocorrências" value={kpi?.total_chamados ?? '—'}
            color="blue" icon={<ShieldAlert size={14} />} />
          <KPICard label="Falhas (SMS)" value={kpi?.total_falhas ?? '—'}
            color="red" icon={<AlertTriangle size={14} />}
            subLabel="Paradas não planejadas" />
          <KPICard label="Defeitos" value={kpi?.total_defeitos ?? '—'}
            color="yellow" icon={<Wrench size={14} />}
            subLabel="Problemas identificados" />
          <KPICard label="Taxa de Fechamento" value={taxaFechamento} unit="%"
            color="green" subLabel={`${kpi?.chamados_fechados ?? 0} de ${kpi?.total_chamados ?? 0}`} />
        </div>

        {/* Gráfico por sistema */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Ocorrências por Sistema
            </h3>
            <OcorrenciasSistemaChart data={ocorrencias} />
          </div>

          {/* Tabela detalhada */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Detalhamento por Sistema
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-gray-500 uppercase text-[10px] tracking-wide">
                    <th className="text-left py-2 pr-3">Sistema</th>
                    <th className="text-right py-2 pr-3">Defeitos</th>
                    <th className="text-right py-2 pr-3">Falhas</th>
                    <th className="text-right py-2 pr-3">Total</th>
                    <th className="text-right py-2">Média h</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: Record<string, any> = {}
                    ocorrencias.forEach(o => {
                      if (!grouped[o.sistema]) grouped[o.sistema] = { sistema: o.sistema, D: 0, F: 0, h: 0 }
                      if (o.tipo_ocorrencia === 'DEFEITO') grouped[o.sistema].D += o.total
                      if (o.tipo_ocorrencia === 'FALHA')   grouped[o.sistema].F += o.total
                      grouped[o.sistema].h += o.media_indisp_horas || 0
                    })
                    return Object.values(grouped)
                      .sort((a, b) => (b.D + b.F) - (a.D + a.F))
                      .map((g: any, i) => (
                        <tr key={i} className="border-b border-surface-border/50 hover:bg-surface-hover">
                          <td className="py-2 pr-3 text-white">{g.sistema}</td>
                          <td className="py-2 pr-3 text-right text-blue-400 tabular-nums">{g.D}</td>
                          <td className="py-2 pr-3 text-right text-red-400 tabular-nums">{g.F}</td>
                          <td className="py-2 pr-3 text-right text-white font-bold tabular-nums">{g.D + g.F}</td>
                          <td className="py-2 text-right text-gray-400 tabular-nums">{g.h.toFixed(1)}h</td>
                        </tr>
                      ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
