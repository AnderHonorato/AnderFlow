'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Bell, BookOpen } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()
  const initials = (session?.user?.name || 'AD').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
  const [stats, setStats] = useState({ onlineNow: 0, maxSimultaneous: 0, visitsToday: 0 })

  useEffect(() => {
    const fetchStats = () => fetch('/api/analytics/online').then(r => r.json()).then(setStats).catch(() => {})
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(222,25%,14%)] bg-[hsl(228,88%,5%)]/90 backdrop-blur flex items-center justify-between px-4 lg:px-6">
      {/* Contadores */}
      <div className="hidden md:flex items-center gap-4 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          {stats.onlineNow} online
        </span>
        <span className="opacity-40">|</span>
        <span>Pico: {stats.maxSimultaneous}</span>
        <span className="opacity-40">|</span>
        <span>{stats.visitsToday} visitas hoje</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Conhecimento - ícone animado */}
        <Link
          href="/knowledge"
          className="btn btn-icon btn-ghost relative group"
          title="Meu Conhecimento"
        >
          <BookOpen className="w-[18px] h-[18px] group-hover:text-primary transition-base" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-white animate-pulse">!</span>
        </Link>

        {/* Notificações */}
        <Link href="/notifications" className="btn btn-icon btn-ghost relative">
          <Bell className="w-[18px] h-[18px]" />
        </Link>

        {/* Perfil dropdown CSS */}
        <div className="relative group ml-1">
          <button className="btn btn-ghost btn-icon rounded-full">
            <span className="avatar avatar-sm bg-[hsl(217,100%,56%,.15)] text-[hsl(217,100%,56%)]">{initials}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-52 bg-[hsl(222,47%,11%)] border border-[hsl(222,25%,14%)] rounded-[14px] p-1.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
            <div className="px-3 py-2 border-b border-[hsl(222,25%,14%)] mb-1">
              <p className="text-sm font-medium">{session?.user?.name || 'Usuário'}</p>
              <p className="text-xs text-[#94A3B8]">{session?.user?.email}</p>
            </div>
            <Link href="/profile" className="block px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[hsl(222,40%,12%)] rounded-[10px] transition-colors">Perfil</Link>
            <Link href="/settings" className="block px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[hsl(222,40%,12%)] rounded-[10px] transition-colors">Configurações</Link>
            <button onClick={() => signOut()} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-[10px] transition-colors mt-1">Sair</button>
          </div>
        </div>
      </div>
    </header>
  )
}
