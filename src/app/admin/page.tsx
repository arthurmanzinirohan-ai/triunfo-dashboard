'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface SyncLog {
  id: number
  synced_at: string
  rows_total: number
  rows_new: number
  status: string
  message: string
}

export default function AdminPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const API = ''

  const loadLogs = async () => {
    try {
      const res = await fetch(`${API}/api/admin/sync-log?limit=20`)
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadLogs() }, [])

  const handleSync = async () => {
    setSyncing(true)
    setLastResult(null)
    try {
      const res = await fetch(`${API}/api/admin/sync`, { method: 'POST' })
      const data = await res.json()
      setLastResult(data)
      await loadLogs()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-14 bg-surface-card border-b border-surface-border px-6 flex items-center">
        <h1 className="text-base font-semibold text-white">Admin / Sincronização</h1>
      </header>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Sync manual */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Sincronização Manual
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Força a leitura da planilha MATRIZ GERAL e atualiza o banco Supabase imediatamente.
            A sincronização automática ocorre diariamente.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>

          {lastResult && (
            <div className={`mt-4 p-3 rounded-lg border text-xs ${
              lastResult.status === 'success' ? 'border-status-green/30 bg-status-green/10' : 'border-status-red/30 bg-status-red/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {lastResult.status === 'success'
                  ? <CheckCircle2 size={13} className="text-green-400" />
                  : <XCircle size={13} className="text-red-400" />
                }
                <span className={lastResult.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {lastResult.message}
                </span>
              </div>
              <span className="text-gray-500">Linhas processadas: {lastResult.rows_new}</span>
            </div>
          )}
        </div>

        {/* Histórico de sincronizações */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Histórico de Sincronizações
          </h3>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
                {log.status === 'success'
                  ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                  : <XCircle size={13} className="text-red-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white">{log.message}</span>
                    <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">
                      {new Date(log.synced_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {log.rows_new} registros · Total: {log.rows_total}
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 py-4">
                <Clock size={13} />
                Nenhuma sincronização registrada ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
