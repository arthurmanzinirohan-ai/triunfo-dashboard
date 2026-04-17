'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import DisponibilidadeGauge from '@/components/dashboard/DisponibilidadeGauge'
import EvolucaoMensalChart from '@/components/dashboard/EvolucaoMensalChart'
import { getKPIsPorContrato, getEvolucaoMensal, getFiltrosOpcoes } from '@/lib/api'
import type { KPIMensal, FiltrosOpcoes } from '@/types'

export default function DisponibilidadePage() {
  const [filtros, setFiltros] = useState<FiltrosOpcoes>({ contratos: [], siglas: [], meses_anos: [], anos: [] })
  const [selected, setSelected] = useState<{ mes_ano?: string; contrato?: string; sigla?: string }>({})
  const [porContrato, setPorContrato] = useState<KPIMensal[]>([])
  const [evolucao, setEvolucao] = useState<KPIMensal[]>([])

  const loadData = useCallback(async () => {
    const [pc, ev, filt] = await Promise.all([
      getKPIsPorContrato(selected.mes_ano),
      getEvolucaoMensal({ contrato: selected.contrato }),
      getFiltrosOpcoes(),
    ])
    setPorContrato(pc as KPIMensal[])
    setEvolucao(ev as KPIMensal[])
    setFiltros(filt as FiltrosOpcoes)
  }, [selected])

  useEffect(() => { loadData() }, [loadData])

  // Agrupa disponibilidade por contrato (média ponderada)
  const contratoMap: Record<string, KPIMensal[]> = {}
  porContrato.forEach(d => {
    if (!contratoMap[d.contrato]) contratoMap[d.contrato] = []
    contratoMap[d.contrato].push(d)
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Disponibilidade"
        filtros={filtros}
        selected={selected}
        onChange={(k, v) => setSelected(prev => ({ ...prev, [k]: v || undefined }))}
      />
      <div className="p-6 space-y-6">
        {/* Gauges por Contrato */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
            Disponibilidade por Contrato
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {Object.entries(contratoMap).map(([contrato, rows]) => {
              const avg = rows.reduce((s, r) => s + (r.disponibilidade_pct || 0), 0) / rows.length
              return (
                <div key={contrato} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-300">{contrato}</span>
                  <DisponibilidadeGauge value={+avg.toFixed(2)} meta={92} />
                </div>
              )
            })}
            {Object.keys(contratoMap).length === 0 && (
              <p className="text-xs text-gray-600 col-span-full text-center py-6">Sem dados disponíveis</p>
            )}
          </div>
        </div>

        {/* Evolução da Disponibilidade */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Evolução Mensal da Disponibilidade
          </h3>
          <EvolucaoMensalChart data={evolucao} mode="disponibilidade" />
        </div>

        {/* Tabela por contrato */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Detalhamento por Contrato / Mês
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 uppercase text-[10px] tracking-wide">
                  <th className="text-left py-2 pr-4">Mês/Ano</th>
                  <th className="text-left py-2 pr-4">Contrato</th>
                  <th className="text-right py-2 pr-4">Disponib. %</th>
                  <th className="text-right py-2 pr-4">Total HH</th>
                  <th className="text-right py-2 pr-4">HH Indisp.</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {porContrato.map((r, i) => {
                  const ok = r.disponibilidade_pct >= 92
                  return (
                    <tr key={i} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                      <td className="py-2 pr-4 text-gray-300">{r.mes_ano}</td>
                      <td className="py-2 pr-4 text-white font-medium">{r.contrato}</td>
                      <td className={`py-2 pr-4 text-right font-bold tabular-nums ${ok ? 'text-green-400' : 'text-red-400'}`}>
                        {r.disponibilidade_pct?.toFixed(2)}%
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-400 tabular-nums">{r.hh_disponivel_mes?.toFixed(0)}h</td>
                      <td className="py-2 pr-4 text-right text-gray-400 tabular-nums">{r.total_horas_indisp?.toFixed(1)}h</td>
                      <td className="py-2 text-right">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ok ? 'badge-ok' : 'badge-danger'}`}>
                          {ok ? 'OK' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
