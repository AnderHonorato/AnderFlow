'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export function WelcomeOverlay() {
  const { data: session } = useSession()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    const dismissed = localStorage.getItem('anderflow_welcome_dismissed')
    if (!dismissed) {
      setVisible(true)
    }
  }, [session?.user?.id])

  const handleDismiss = () => {
    localStorage.setItem('anderflow_welcome_dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  const name = session?.user?.name || 'Usuário'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6 animate-scale-in space-y-5 text-center">
        <svg className="mx-auto" width="40" height="40" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="var(--primary)"/>
          <path d="M7 22l6-15h4l4 10h-4l-3-5-4 10H7z" fill="#fff" opacity="0.9"/>
          <path d="M13 19c2-2 3-3 5-3h3c-1 2-2 3-4 3h-4z" fill="#fff" opacity="0.5"/>
        </svg>

        <div>
          <h2 className="text-lg font-medium text-[var(--text)]">Bem-vindo(a), {name}!</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            Sua conta foi criada com sucesso. Agora você pode solicitar projetos,
            acompanhar o andamento em tempo real, enviar mensagens e muito mais.
          </p>
        </div>

        <div className="space-y-2 text-left bg-[var(--surface-hover)] rounded-md p-3">
          {[
            'Solicite serviços e projetos personalizados',
            'Acompanhe cada etapa em tempo real',
            'Converse diretamente com a equipe',
            'Aprove etapas e veja o progresso',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--success)] mt-0.5">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>

        <Button onClick={handleDismiss} className="w-full">
          Entendi
        </Button>
      </div>
    </div>
  )
}
