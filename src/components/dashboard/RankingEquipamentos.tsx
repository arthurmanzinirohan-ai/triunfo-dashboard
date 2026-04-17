'use client'
import { RankingEquipamento } from '@/types'
import clsx from 'clsx'

interface Props { data: RankingEquipamento[] }

const siglaBadge: Record<string, string> = {
  EM: 'badge-info',
  CA: 'badge-warn',
  GN: 'badge-danger',
  ES: 'badge-ok',
  PA: 'badge-info',
}

export default function RankingEquipamentos({ data }: Props) {
  const max = data[0]?.total_chamados || 1

  return (
    <div className="space-y-2">
      {data.map((eq, i) => (
        <div key={eq.eqpto_codigo} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
          <span className="text-xs text-gray-600 w-4 text-right font-mono">{i + 1}</span>
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', siglaBadge[eq.sigla] || 'badge-info')}>
            {eq.sigla}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white font-medium truncate">{eq.eqpto_codigo}</span>
              <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{eq.total_chamados} chamados</span>
            </div>
            {/* Barra de progresso relativa */}
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(eq.total_chamados / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white font-mono">{eq.total_horas_indisp?.toFixed(0)}h</div>
            <div className="text-[10px] text-gray-600">indisp.</div>
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-4">Sem dados</p>
      )}
    </div>
  )
}
