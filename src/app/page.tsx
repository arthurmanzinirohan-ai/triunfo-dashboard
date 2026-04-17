'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Wrench, Clock, AlertTriangle,
  CheckCircle2, XCircle, BarChart2, Timer,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import KPICard from '@/components/dashboard/KPICard'
import DisponibilidadeGauge from '@/components/dashboard/DisponibilidadeGauge'
import EvolucaoMensalChart from '@/components/dashboard/EvolucaoMensalChart'
import OcorrenciasSistemaChart from '@/components/dashboard/OcorrenciasSistemaChart'
import RankingEquipamentos from '@/components/dashboard/RankingEquipamentos'
import {
  getKPIResumo, getEvolucaoMensal, getOcorrenciasPorSistema,
  getRankingEquipamentos, getFiltrosOpcoes,
} from '@/lib/api'
import type { KPIResumo, KPIMensal, OcorrenciaSistema, RankingEquipamento, FiltrosOpcoes } from '@/types'

type ChartMode = 'chamados' | 'disponibilidade' | 'mttr'

const CHART_TABS: { key: ChartMode; label: string }[] = [
  { key: 'chamados',       label: 'Chamados' },
  { key: 'disponibilidade', label: 'Disponibilidade' },
  { key: 'mttr',            label: 'MTTR' },
]

export default function HomePage() {
  const [filtros, setFiltros] = useState<FiltrosOpcoes>({ contratos: [], siglas: [], meses_anos: [], anos: [] })
  const [selected, setSelected] = useState<{ mes_ano?: string; contrato?: string; sigla?: string; ano?: string }>({})
  const [kpi, setKpi] = useState<KPIResumo | null>(null)
  const [evolucao, setEvolucao] = useState<KPIMensal[]>([])
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaSistema[]>([])
  const [ranking, setRanking] = useState<RankingEquipamento[]>([])
  const [chartMode, setChartMode] = useState<ChartMode>('chamados')
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [k, ev, oc, rank, filt] = await Promise.all([
        getKPIResumo(selected),
        getEvolucaoMensal({ contrato: selected.contrato, sigla: selected.sigla }),
        getOcorrenciasPorSistema({ mes_ano: selected.mes_ano, contrato: selected.contrato }),
        getRankingEquipamentos(selected.contrato, 10),
        getFiltrosOpcoes(),
      ])
      setKpi(k as KPIResumo)
      setEvolucao(ev as KPIMensal[])
      setOcorrencias(oc as OcorrenciaSistema[])
      setRanking(rank as RankingEquipamento[])
      setFiltros(filt as FiltrosOpcoes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => { loadData() }, [loadData])

  const handleFiltro = (key: string, val: string) =>
    setSelected(prev => ({ ...prev, [key]: val || undefined }))

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/admin/sync`, { method: 'POST' })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Erro ao sincronizar:', err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Visão Geral"
        filtros={filtros}
        selected={selected}
        onChange={handleFiltro}
        onSync={handleSync}
        syncing={syncing}
      />

      <div className="p-6 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <KPICard
            label="Total Chamados"
            value={kpi?.total_chamados ?? '—'}
            color="blue"
            icon={<BarChart2 size={14} />}
          />
          <KPICard
            label="Falhas"
            value={kpi?.total_falhas ?? '—'}
            color="red"
            icon={<AlertTriangle size={14} />}
          />
          <KPICard
            label="Defeitos"
            value={kpi?.total_defeitos ?? '—'}
            color="yellow"
            icon={<Wrench size={14} />}
          />
          <KPICard
            label="Fechados"
            value={kpi?.chamados_fechados ?? '—'}
            color="green"
            icon={<CheckCircle2 size={14} />}
          />
          <KPICard
            label="Em aberto"
            value={kpi?.chamados_abertos ?? '—'}
            color="yellow"
            icon={<XCircle size={14} />}
          />
          <KPICard
            label="MTTR"
            value={kpi ? kpi.mttr_horas.toFixed(1) : '—'}
            unit="h"
            color="blue"
            icon={<Clock size={14} />}
            subLabel="Tempo médio reparo"
          />
          <KPICard
            label="MTBF"
            value={kpi ? kpi.mtbf_horas.toFixed(1) : '—'}
            unit="h"
            color="green"
            icon={<Timer size={14} />}
            subLabel="Tempo entre falhas"
          />
        </div>

        {/* ── Disponibilidade + Evolução Mensal ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Gauge de Disponibilidade */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col items-center justify-center gap-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Disponibilidade</h3>
            <DisponibilidadeGauge
              value={kpi?.disponibilidade_pct ?? 0}
              meta={kpi?.meta_disponibilidade ?? 92}
            />
            <div className="text-center mt-1">
              <div className="text-xs text-gray-500">{kpi?.total_horas_indisp?.toFixed(1)} h indisponível</div>
            </div>
          </div>

          {/* Gráfico de evolução */}
          <div className="xl:col-span-3 bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Evolução Mensal</h3>
              <div className="flex gap-1">
                {CHART_TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setChartMode(t.key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      chartMode === t.key
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-surface-hover'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <EvolucaoMensalChart data={evolucao} mode={chartMode} />
          </div>
        </div>

        {/* ── Ocorrências por Sistema + Ranking ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Ocorrências por Sistema
            </h3>
            <OcorrenciasSistemaChart data={ocorrencias} />
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Ranking — Equipamentos com mais ocorrências
            </h3>
            <RankingEquipamentos data={ranking} />
          </div>
        </div>

        {loading && (
          <div className="fixed bottom-4 right-4 bg-primary-500/20 border border-primary-500/30 rounded-lg px-3 py-2 text-xs text-primary-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            Carregando dados...
          </div>
        )}
      </div>
    </div>
  )
}
