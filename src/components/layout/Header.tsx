'use client'
import { useState } from 'react'
import { RefreshCw, Filter, Bell } from 'lucide-react'
import { FiltrosOpcoes } from '@/types'

interface Props {
  title: string
  filtros: FiltrosOpcoes
  selected: { mes_ano?: string; contrato?: string; sigla?: string; ano?: string }
  onChange: (key: string, val: string) => void
  onSync?: () => void
  syncing?: boolean
}

export default function Header({ title, filtros, selected, onChange, onSync, syncing }: Props) {
  return (
    <header className="h-14 bg-surface-card border-b border-surface-border px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>

        {/* Filtros */}
        <div className="flex items-center gap-2 ml-4">
          <Filter size={13} className="text-gray-500" />

          <select
            value={selected.ano || ''}
            onChange={e => onChange('ano', e.target.value)}
            className="bg-white border border-surface-border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos os anos</option>
            {(filtros.anos || []).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={selected.mes_ano || ''}
            onChange={e => onChange('mes_ano', e.target.value)}
            className="bg-white border border-surface-border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos os meses</option>
            {(filtros.meses_anos || []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selected.contrato || ''}
            onChange={e => onChange('contrato', e.target.value)}
            className="bg-white border border-surface-border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos os contratos</option>
            {(filtros.contratos || []).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selected.sigla || ''}
            onChange={e => onChange('sigla', e.target.value)}
            className="bg-white border border-surface-border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos os equipamentos</option>
            {(filtros.siglas || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded text-gray-600 hover:text-gray-900 hover:bg-surface-hover transition-colors">
          <Bell size={15} />
        </button>
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 border border-primary-500 rounded text-xs text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>
    </header>
  )
}
