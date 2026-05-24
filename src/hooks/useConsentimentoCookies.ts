'use client'

import { useState, useEffect } from 'react'

interface ConsentimentoCookies {
  essenciais: boolean
  analytics: boolean
  preferencias: boolean
  data: string
}

export function useConsentimentoCookies() {
  const [consentimento, setConsentimento] = useState<ConsentimentoCookies | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('anderflow-cookies-consent')
      if (stored) {
        const dados = JSON.parse(stored) as ConsentimentoCookies
        setConsentimento(dados)
      }
    } catch {
      // falha ao ler consentimento
    }
  }, [])

  return {
    consentido: consentimento !== null,
    analytics: consentimento?.analytics ?? false,
    preferencias: consentimento?.preferencias ?? false,
    dados: consentimento,
  }
}
