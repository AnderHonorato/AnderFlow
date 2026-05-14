'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useUIStore, useOnlineStore } from '@/stores/app-store'

export function Header() {
  const { data: session } = useSession()
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore()
  const { onlineNow, maxSimultaneous, visitsToday } = useOnlineStore()

  const initials = (session?.user?.name || 'AD').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(222,25%,14%)] bg-[hsl(228,88%,5%)]/90 backdrop-blur flex items-center justify-between px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileMenu}
        className="btn btn-icon btn-ghost lg:hidden"
        aria-label="Menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Stats inline */}
      <div className="hidden md:flex items-center gap-4 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          {onlineNow} online
        </span>
        <span className="opacity-50">|</span>
        <span>Pico: {maxSimultaneous}</span>
        <span className="opacity-50">|</span>
        <span>{visitsToday} visitas hoje</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notifications */}
        <Link href="/notifications" className="btn btn-icon btn-ghost relative">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </Link>

        {/* User dropdown CSS puro */}
        <div className="relative group">
          <button className="btn btn-ghost btn-icon rounded-full">
            <span className="avatar avatar-sm bg-[hsl(217,100%,56%,.15)] text-[hsl(217,100%,56%)]">{initials}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-52 bg-[hsl(222,47%,11%)] border border-[hsl(222,25%,14%)] rounded-[14px] p-1.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
            <div className="px-3 py-2 border-b border-[hsl(222,25%,14%)] mb-1">
              <p className="text-sm font-medium">{session?.user?.name || 'Usuário'}</p>
              <p className="text-xs text-[#94A3B8]">{session?.user?.email}</p>
            </div>
            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[hsl(222,40%,12%)] rounded-[10px] transition-colors">Perfil</Link>
            <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[hsl(222,40%,12%)] rounded-[10px] transition-colors">Configurações</Link>
            <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-[10px] transition-colors mt-1">Sair</button>
          </div>
        </div>
      </div>
    </header>
  )
}
