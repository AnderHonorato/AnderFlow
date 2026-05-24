import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import './globals.css'
import { SessionProvider } from '@/providers/session-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-dm-sans' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['300','400','500','600','700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', weight: ['300','400','500','700'] })

export const metadata: Metadata = {
  title: 'ANDERFLOW Sistemas | Fluxo inteligente para empresas modernas',
  description: 'Plataforma SaaS premium: gestão de projetos, CRM, portal do cliente e automações.',
  keywords: ['gestão de projetos', 'CRM', 'SaaS', 'portal do cliente', 'automação'],
  icons: { icon: '/branding/favicon.svg', apple: '/branding/icon.svg' },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'ANDERFLOW Sistemas | Fluxo inteligente para empresas modernas',
    description: 'Plataforma SaaS premium: gestão de projetos, CRM, portal do cliente e automações.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANDERFLOW Sistemas',
    description: 'Gestão de projetos, CRM, portal do cliente e automações.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#E8622A',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} ${jakarta.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[var(--bg)] text-[var(--text)]`}>
        <SessionProvider session={session}>
          <ThemeProvider defaultTheme="dark">
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
