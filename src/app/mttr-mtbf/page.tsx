'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Header from '@/components/layout/Header'
import KPICard from '@/components/dashboard/KPICard'
import { getKPIResumo, getEvolucaoMensal, getFiltrosOpcoes } from '@/lib/api'
import type { KPIResumo, KPIMensal, FiltrosOpcoes } from '@/types'
import { Clock, Timer } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">{p.value?.toFixed(2)}h</span>
        </div>
      ))}
    </div>
  )
}

export default function MTTRMTBFPage() {
  const [filtros, setFiltros] = useState<FiltrosOpcoes>({ contratos: [], siglas: [], meses_anos: [], anos: [] })
  const [selected, setSelected] = useState<{ mes_ano?: string; contrato?: string; sigla?: string }>({})
  const [kpi, setKpi] = useState<KPIResumo | null>(null)
  const [evolucao, setEvolucao] = useState<KPIMensal[]>([])

  const loadData = useCallback(async () => {
    const [k, ev, filt] = await Promise.all([
      getKPIResumo(selected),
      getEvolucaoMensal({ contrato: selected.contrato, sigla: selected.sigla }),
      getFiltrosOpcoes(),
    ])
    setKpi(k as KPIResumo)
    setEvolucao(ev as KPIMensal[])
    setFiltros(filt as FiltrosOpcoes)
  }, [selected])

  useEffect(() => { loadData() }, [loadData])

  // Agrupa evolução por mes_ano
  const grouped: Record<string, any> = {}
  evolucao.forEach(d => {
    if (!grouped[d.mes_ano]) grouped[d.mes_ano] = { mes_ano: d.mes_ano, mttr: 0, mtbf: 0, _c: 0 }
    grouped[d.mes_ano].mttr += d.mttr_horas || 0
    grouped[d.mes_ano].mtbf += d.mtbf_horas || 0
    grouped[d.mes_ano]._c++
  })
  const chartData = Object.values(grouped)
    .map((g: any) => ({
      mes_ano: g.mes_ano,
      'MTTR (h)': +(g.mttr / g._c).toFixed(2),
      'MTBF (h)': +(g.mtbf / g._c).toFixed(2),
    }))
    .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano))

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="MTTR / MTBF"
        filtros={filtros}
        selected={selected}
        onChange={(k, v) => setSelected(prev => ({ ...prev, [k]: v || undefined }))}
      />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="MTTR" value={kpi?.mttr_horas?.toFixed(2) ?? '—'} unit="h"
            color="blue" icon={<Clock size={14} />}
            subLabel="Tempo médio de reparo" />
          <KPICard label="MTBF" value={kpi?.mtbf_horas?.toFixed(2) ?? '—'} unit="h"
            color="green" icon={<Timer size={14} />}
            subLabel="Tempo médio entre falhas" />
          <KPICard label="Total Falhas" value={kpi?.total_falhas ?? '—'}
            color="red" subLabel="Chamados tipo FALHA" />
          <KPICard label="HH Indisponível" value={kpi?.total_horas_indisp?.toFixed(1) ?? '—'} unit="h"
            color="yellow" subLabel="Horas paradas total" />
        </div>

        {/* Gráfico MTTR vs MTBF */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Evolução MTTR vs MTBF por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="mes_ano" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e' }} />
              <Bar dataKey="MTTR (h)" fill="#388bfd" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="MTBF (h)" stroke="#2ea043" strokeWidth={2}
                dot={{ fill: '#2ea043', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de referência */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Referência — O que significam os indicadores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
            <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-primary-400" />
                <span className="text-white font-medium">MTTR — Mean Time To Repair</span>
              </div>
              <p>Tempo médio necessário para reparar um equipamento após uma falha ou defeito.</p>
              <p className="mt-1 text-gray-500">Fórmula: Σ Tempo Indisponível ÷ Nº Chamados</p>
              <p className="mt-1 text-primary-400 font-medium">Quanto menor, melhor.</p>
            </div>
            <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={14} className="text-green-400" />
                <span className="text-white font-medium">MTBF — Mean Time Between Failures</span>
              </div>
              <p>Tempo médio de operação entre uma falha e a próxima.</p>
              <p className="mt-1 text-gray-500">Fórmula: (HH Disponível − Σ Indisp.) ÷ Nº Falhas</p>
              <p className="mt-1 text-green-400 font-medium">Quanto maior, melhor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
