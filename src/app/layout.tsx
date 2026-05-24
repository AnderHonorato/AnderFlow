import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-dm-sans' })

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased bg-[var(--bg)] text-[var(--text)]`}>
        <ThemeProvider defaultTheme="dark">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
