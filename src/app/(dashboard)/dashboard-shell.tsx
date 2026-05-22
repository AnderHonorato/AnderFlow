'use client'

import { SessionProvider } from '@/providers/session-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PageTip } from '@/components/ui/page-tips'
import { WelcomeOverlay } from '@/components/ui/welcome-overlay'
import { AIFab } from '@/components/ui/ai-fab'
import { BotEngineInit } from '@/components/bots/motor-inicializador'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div style={{position:'absolute',top:'8%',right:'-6%',width:'340px',height:'340px',borderRadius:'58% 42% 52% 48% / 52% 44% 56% 48%',background:'radial-gradient(ellipse,rgba(232,98,42,0.04) 0%,transparent 70%)',animation:'blobMorphA 12s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:'15%',left:'-4%',width:'260px',height:'260px',borderRadius:'44% 56% 58% 42% / 50% 58% 42% 50%',background:'radial-gradient(ellipse,rgba(58,122,196,0.03) 0%,transparent 65%)',animation:'blobMorphC 14s ease-in-out infinite'}}/>
        <div style={{position:'absolute',top:'45%',left:'25%',width:'180px',height:'180px',borderRadius:'48% 52% 64% 36% / 52% 44% 56% 48%',background:'radial-gradient(ellipse,rgba(139,92,246,0.025) 0%,transparent 70%)',animation:'blobMorphB 16s ease-in-out infinite'}}/>
      </div>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]" suppressHydrationWarning>
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto scroll-area">
          <Header />
          <PageTip />
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <AIFab />
      <WelcomeOverlay />
      <BotEngineInit />
    </SessionProvider>
  )
}
