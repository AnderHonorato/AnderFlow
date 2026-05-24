'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bug, X, Camera, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  erroPreenchido?: string
}

export function ReportarErro({ erroPreenchido }: Props) {
  const [visivel, setVisivel] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [consentiu, setConsentiu] = useState(false)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [erroMsg, setErroMsg] = useState(erroPreenchido || '')
  const capturandoRef = useRef(false)

  const capturarScreenshot = useCallback(async () => {
    if (capturandoRef.current || screenshot) return
    capturandoRef.current = true
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(document.body, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a0a',
        scale: 0.5,
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png')
      setScreenshot(dataUrl)
    } catch {
      // falha silenciosa na captura
    } finally {
      capturandoRef.current = false
    }
  }, [screenshot])

  useEffect(() => {
    if (erroPreenchido) {
      setErroMsg(erroPreenchido)
      setVisivel(true)
    }
  }, [erroPreenchido])

  useEffect(() => {
    const capturar = (evento: ErrorEvent) => {
      setErroMsg(evento.message)
      setVisivel(true)
    }
    const rejeitar = (evento: PromiseRejectionEvent) => {
      setErroMsg(evento.reason?.message || String(evento.reason))
      setVisivel(true)
    }
    window.addEventListener('error', capturar)
    window.addEventListener('unhandledrejection', rejeitar)
    return () => {
      window.removeEventListener('error', capturar)
      window.removeEventListener('unhandledrejection', rejeitar)
    }
  }, [])

  const abrirModal = async () => {
    setModalAberto(true)
    if (!screenshot) {
      await capturarScreenshot()
    }
  }

  const enviarRelatorio = async () => {
    if (!consentiu) {
      toast.error('E necessario consentir com o envio dos dados')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/reportar-erro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot: screenshot || null,
          comentario,
          url: window.location.href,
          userAgent: navigator.userAgent,
          erroMsg,
          timestamp: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Relatorio enviado. Obrigado!')
        setModalAberto(false)
        setVisivel(false)
        setComentario('')
        setConsentiu(false)
        setScreenshot(null)
      } else {
        toast.error('Erro ao enviar relatorio')
      }
    } catch {
      toast.error('Erro ao enviar relatorio')
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalAberto) {
        setModalAberto(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [modalAberto])

  return (
    <>
      {visivel && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg text-[12px] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--destructive-subtle)] transition-all duration-200"
          onClick={abrirModal}
        >
          <Bug className="w-[14px] h-[14px] text-[var(--destructive)]" />
          Reportar Erro
        </motion.button>
      )}

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setModalAberto(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--destructive-subtle)]">
                    <Bug className="h-4 w-4 text-[var(--destructive)]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-[600] text-[var(--text)]">Reportar Erro</h3>
                    <p className="text-[11px] text-[var(--text-3)]">Ajude-nos a melhorar o sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalAberto(false)}
                  aria-label="Fechar modal"
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[12px]">Descreva o que aconteceu antes do erro (opcional)</Label>
                  <Textarea
                    placeholder="Ex: Eu estava tentando criar um novo projeto quando..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="min-h-[80px] text-[13px]"
                  />
                </div>

                {erroMsg && (
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-3)] uppercase mb-1">Erro detectado</p>
                    <p className="text-[12px] text-[var(--destructive)] font-mono">{erroMsg}</p>
                  </div>
                )}

                {screenshot ? (
                  <div className="relative rounded-lg overflow-hidden border border-[var(--border)]">
                    <img src={screenshot} alt="Captura de tela" className="w-full h-auto" />
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">
                      <Camera className="h-2.5 w-2.5" /> Preview
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--text-3)]" />
                  </div>
                )}

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <Checkbox
                    id="consent-lgpd"
                    checked={consentiu}
                    onCheckedChange={(v) => setConsentiu(v === true)}
                  />
                  <div>
                    <Label htmlFor="consent-lgpd" className="text-[11px] leading-relaxed text-[var(--text-2)]">
                      Concordo em enviar capturas de tela e dados tecnicos desta sessao para analise de erros. Nenhum dado pessoal sensivel sera coletado alem do necessario.
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]">
                <Button variant="ghost" size="sm" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={enviarRelatorio}
                  disabled={!consentiu || enviando}
                >
                  {enviando ? (
                    <><Loader2 className="w-[14px] h-[14px] mr-1.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-[14px] h-[14px] mr-1.5" /> Enviar Relatorio</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
