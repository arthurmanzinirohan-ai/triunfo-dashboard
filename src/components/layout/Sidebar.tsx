'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wrench, Activity, BarChart3,
  ClipboardList, Settings, ChevronRight, Zap,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/',                  icon: LayoutDashboard, label: 'Visão Geral' },
  { href: '/disponibilidade',   icon: Activity,        label: 'Disponibilidade' },
  { href: '/ocorrencias',       icon: Wrench,          label: 'Ocorrências' },
  { href: '/mttr-mtbf',         icon: BarChart3,       label: 'MTTR / MTBF' },
  { href: '/chamados',          icon: ClipboardList,   label: 'Chamados' },
  { href: '/admin',             icon: Settings,        label: 'Admin / Sync' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 min-h-screen bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">TRIUNFO</div>
            <div className="text-[10px] text-gray-500 leading-tight">LOGÍSTICA</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
          Indicadores
        </p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group',
                active
                  ? 'bg-primary-500/10 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-surface-hover hover:text-gray-900'
              )}
            >
              <Icon size={16} className={active ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="text-primary-600" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-border">
        <p className="text-[10px] text-gray-600">v1.0.0 · Atualização diária</p>
      </div>
    </aside>
  )
}
