import { Suspense } from 'react'
import LandingClient from '@/components/landing/landing-client'

export const metadata = {
  title: 'ANDERFLOW Sistemas | Fluxo inteligente para empresas modernas',
  description:
    'Plataforma SaaS premium: gestao de projetos, CRM, portal do cliente e automacoes.',
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <LandingClient />
    </Suspense>
  )
}
