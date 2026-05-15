'use client'

import { SessionProvider } from '@/providers/session-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PageTip } from '@/components/ui/page-tips'
import { WelcomeOverlay } from '@/components/ui/welcome-overlay'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <PageTip />
          <main className="flex-1 overflow-y-auto scroll-area">{children}</main>
        </div>
      </div>
      <WelcomeOverlay />
    </SessionProvider>
  )
}
