import { SessionProvider } from '@/providers/session-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PageTip } from '@/components/ui/page-tips'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-[hsl(228,88%,5%)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <PageTip />
          <main className="flex-1 overflow-y-auto scroll-area">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
