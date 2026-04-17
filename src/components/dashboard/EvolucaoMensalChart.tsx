'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { KPIMensal } from '@/types'

interface Props {
  data: KPIMensal[]
  mode?: 'chamados' | 'disponibilidade' | 'mttr'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">{
            typeof p.value === 'number' ? p.value.toFixed(1) : p.value
          }</span>
        </div>
      ))}
    </div>
  )
}

export default function EvolucaoMensalChart({ data, mode = 'chamados' }: Props) {
  // Agrupa por mes_ano (soma contratos)
  const grouped: Record<string, any> = {}
  data.forEach(d => {
    if (!grouped[d.mes_ano]) {
      grouped[d.mes_ano] = {
        mes_ano: d.mes_ano, total_chamados: 0, total_falhas: 0,
        total_defeitos: 0, disponibilidade_pct: 0, mttr_horas: 0,
        _count: 0,
      }
    }
    const g = grouped[d.mes_ano]
    g.total_chamados  += d.total_chamados || 0
    g.total_falhas    += d.total_falhas || 0
    g.total_defeitos  += d.total_defeitos || 0
    g.disponibilidade_pct += d.disponibilidade_pct || 0
    g.mttr_horas      += d.mttr_horas || 0
    g._count++
  })

  const chartData = Object.values(grouped).map((g: any) => ({
    ...g,
    disponibilidade_pct: g._count ? +(g.disponibilidade_pct / g._count).toFixed(2) : 0,
    mttr_horas: g._count ? +(g.mttr_horas / g._count).toFixed(2) : 0,
  })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano))

  return (
    <ResponsiveContainer width="100%" height={280}>
      {mode === 'chamados' ? (
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="mes_ano" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e' }} />
          <Bar dataKey="total_defeitos" name="Defeitos" fill="#388bfd" radius={[3,3,0,0]} />
          <Bar dataKey="total_falhas"   name="Falhas"   fill="#da3633" radius={[3,3,0,0]} />
          <Line type="monotone" dataKey="total_chamados" name="Total" stroke="#d29922" strokeWidth={2} dot={{ fill: '#d29922', r: 3 }} />
        </ComposedChart>
      ) : mode === 'disponibilidade' ? (
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="mes_ano" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e' }} />
          <ReferenceLine y={92} stroke="#2ea043" strokeDasharray="4 2" label={{ value: 'Meta 92%', fill: '#2ea043', fontSize: 10 }} />
          <Bar dataKey="disponibilidade_pct" name="Disponibilidade %" fill="#2ea043" radius={[3,3,0,0]} />
        </ComposedChart>
      ) : (
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="mes_ano" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e' }} />
          <Bar dataKey="mttr_horas" name="MTTR (h)" fill="#388bfd" radius={[3,3,0,0]} />
        </ComposedChart>
      )}
    </ResponsiveContainer>
  )
}
