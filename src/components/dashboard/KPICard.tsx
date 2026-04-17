'use client'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  unit?: string
  meta?: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
  icon?: React.ReactNode
  subLabel?: string
}

const colorMap = {
  blue:   { border: 'border-primary-500/20', bg: 'bg-primary-500/10', text: 'text-primary-600', dot: 'bg-primary-500' },
  green:  { border: 'border-status-green/20', bg: 'bg-status-green/10', text: 'text-status-green', dot: 'bg-status-green' },
  yellow: { border: 'border-status-yellow/20', bg: 'bg-status-yellow/10', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  red:    { border: 'border-status-red/20', bg: 'bg-status-red/10', text: 'text-status-red', dot: 'bg-status-red' },
}

export default function KPICard({ label, value, unit, meta, trend, trendValue, color = 'blue', icon, subLabel }: Props) {
  const c = colorMap[color]

  return (
    <div className={clsx(
      'bg-surface-card border rounded-xl p-4 card-hover flex flex-col gap-2',
      c.border
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</span>
        {icon && (
          <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', c.bg)}>
            <span className={c.text}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5 mt-1">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-gray-500 mb-0.5">{unit}</span>}
      </div>

      {/* Meta + Trend */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-surface-border">
        {meta !== undefined && (
          <span className="text-[11px] text-gray-600">Meta: {meta}{unit}</span>
        )}
        {trend && trendValue && (
          <div className={clsx(
            'flex items-center gap-1 text-[11px] font-medium',
            trend === 'up' ? 'text-status-green' : trend === 'down' ? 'text-status-red' : 'text-gray-500'
          )}>
            {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trendValue}
          </div>
        )}
        {subLabel && <span className="text-[11px] text-gray-600">{subLabel}</span>}
      </div>
    </div>
  )
}
