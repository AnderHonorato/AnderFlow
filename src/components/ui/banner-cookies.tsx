'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie, ShieldCheck, BarChart3, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ConsentimentoCookies {
  essenciais: boolean
  analytics: boolean
  preferencias: boolean
  data: string
}

export function BannerCookies() {
  const [visivel, setVisivel] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [preferencias, setPreferencias] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('anderflow-cookies-consent')
    if (!stored) {
      const timer = setTimeout(() => setVisivel(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const salvarConsentimento = (opcoes: { analytics: boolean; preferencias: boolean }) => {
    const dados: ConsentimentoCookies = {
      essenciais: true,
      analytics: opcoes.analytics,
      preferencias: opcoes.preferencias,
      data: new Date().toISOString(),
    }
    localStorage.setItem('anderflow-cookies-consent', JSON.stringify(dados))
    setVisivel(false)
  }

  const aceitarTodos = () => salvarConsentimento({ analytics: true, preferencias: true })
  const aceitarSelecionados = () => salvarConsentimento({ analytics, preferencias })
  const recusarOpcionais = () => salvarConsentimento({ analytics: false, preferencias: false })

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[70]"
        >
          <div className="bg-[var(--surface)] border-t border-[var(--border)] shadow-[0_-8px_32px_rgba(0,0,0,0.25)]">
            <div className="max-w-[720px] mx-auto px-4 py-4 sm:px-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
                  <Cookie className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-[600] text-[var(--text)]">
                    Este site utiliza cookies
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] mt-1 leading-relaxed">
                    Utilizamos cookies essenciais para o funcionamento do sistema (login, seguranca).
                    Cookies opcionais nos ajudam a melhorar sua experiencia com analytics e preferencias de interface.
                    Seus dados sao tratados conforme a <strong>LGPD (Lei 13.709/2018)</strong>.
                  </p>
                </div>
                <button
                  onClick={aceitarSelecionados}
                  aria-label="Salvar preferencias e fechar banner"
                  title="Fechar"
                  className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <Checkbox id="cookie-essencial" checked disabled />
                  <div>
                    <Label htmlFor="cookie-essencial" className="text-[11px] font-[500] flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-[var(--success)]" />
                      Essenciais
                    </Label>
                    <p className="text-[10px] text-[var(--text-3)] mt-0.5 leading-relaxed">Login, sessao e seguranca. Sempre ativos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <Checkbox
                    id="cookie-analytics"
                    checked={analytics}
                    onCheckedChange={(v) => setAnalytics(v === true)}
                  />
                  <div>
                    <Label htmlFor="cookie-analytics" className="text-[11px] font-[500] flex items-center gap-1.5 cursor-pointer">
                      <BarChart3 className="h-3 w-3 text-[var(--info)]" />
                      Analytics
                    </Label>
                    <p className="text-[10px] text-[var(--text-3)] mt-0.5 leading-relaxed">Metricas anonimas de uso para melhorarmos o sistema.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <Checkbox
                    id="cookie-preferencias"
                    checked={preferencias}
                    onCheckedChange={(v) => setPreferencias(v === true)}
                  />
                  <div>
                    <Label htmlFor="cookie-preferencias" className="text-[11px] font-[500] flex items-center gap-1.5 cursor-pointer">
                      <Palette className="h-3 w-3 text-[var(--warning)]" />
                      Preferencias
                    </Label>
                    <p className="text-[10px] text-[var(--text-3)] mt-0.5 leading-relaxed">Tema, idioma e customizacoes de interface.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={recusarOpcionais}>
                  Recusar Opcionais
                </Button>
                <Button variant="outline" size="sm" onClick={aceitarSelecionados}>
                  Aceitar Selecionados
                </Button>
                <Button size="sm" onClick={aceitarTodos}>
                  Aceitar Todos
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
