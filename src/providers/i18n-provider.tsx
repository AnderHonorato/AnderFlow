'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { t as translate, type LangKey } from '@/lib/i18n'

interface I18nContextType {
  language: LangKey
  t: (key: string) => string
  setLanguage: (lang: LangKey) => void
}

const I18nContext = createContext<I18nContextType>({
  language: 'pt-BR',
  t: (key: string) => key,
  setLanguage: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const userLang = (session?.user as any)?.language || 'pt-BR'
  const [language, setLanguage] = useState<LangKey>((userLang === 'en' ? 'en' : 'pt-BR') as LangKey)

  useEffect(() => {
    if (userLang && (userLang === 'en' || userLang === 'pt-BR')) {
      setLanguage(userLang as LangKey)
    }
  }, [userLang])

  const t = (key: string) => translate(key, language)

  const handleSetLanguage = (lang: LangKey) => {
    setLanguage(lang)
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {})
  }

  return (
    <I18nContext.Provider value={{ language, t, setLanguage: handleSetLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
