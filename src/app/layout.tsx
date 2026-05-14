import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ANDERFLOW Sistemas | Fluxo inteligente para empresas modernas',
  description: 'Plataforma SaaS premium: gestão de projetos, CRM, portal do cliente e automações.',
  icons: { icon: '/branding/favicon.svg', apple: '/branding/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans bg-[hsl(228,88%,5%)] text-[#EAF2FF] antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
