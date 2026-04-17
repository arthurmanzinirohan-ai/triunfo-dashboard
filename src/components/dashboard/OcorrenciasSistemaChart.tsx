'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { OcorrenciaSistema } from '@/types'

interface Props { data: OcorrenciaSistema[] }

const COLORS: Record<string, string> = {
  'ELÉTRICO':    '#388bfd',
  'MECÂNICO':    '#d29922',
  'HIDRÁULICO':  '#2ea043',
  'ESTRUTURAL':  '#da3633',
  'PNEUMÁTICO':  '#a371f7',
  'DEFAULT':     '#8b949e',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-400">{p.name}: </span>
          <span className="text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OcorrenciasSistemaChart({ data }: Props) {
  // Agrupa por sistema
  const grouped: Record<string, { sistema: string; DEFEITO: number; FALHA: number }> = {}
  data.forEach(d => {
    if (!grouped[d.sistema]) grouped[d.sistema] = { sistema: d.sistema, DEFEITO: 0, FALHA: 0 }
    if (d.tipo_ocorrencia === 'DEFEITO') grouped[d.sistema].DEFEITO += d.total
    if (d.tipo_ocorrencia === 'FALHA')   grouped[d.sistema].FALHA   += d.total
  })
  const chartData = Object.values(grouped).sort((a, b) => (b.DEFEITO + b.FALHA) - (a.DEFEITO + a.FALHA))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="sistema" type="category" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e' }} />
        <Bar dataKey="DEFEITO" name="Defeito" fill="#388bfd" radius={[0,3,3,0]} />
        <Bar dataKey="FALHA"   name="Falha"   fill="#da3633" radius={[0,3,3,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
