'use client'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  value: number  // porcentagem 0-100
  meta?: number  // ex: 92
}

export default function DisponibilidadeGauge({ value, meta = 92 }: Props) {
  const ok = value >= meta
  const color = value >= meta ? '#2ea043' : value >= meta - 5 ? '#d29922' : '#da3633'

  const data = [{ name: 'Disponibilidade', value, fill: color }]

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="90%"
            data={data}
            startAngle={225} endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#21262d' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Valor central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{value.toFixed(1)}%</span>
          <span className="text-[10px] text-gray-500">Meta: {meta}%</span>
        </div>
      </div>
      <span className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${ok ? 'badge-ok' : 'badge-danger'}`}>
        {ok ? 'Dentro da meta' : 'Abaixo da meta'}
      </span>
    </div>
  )
}
