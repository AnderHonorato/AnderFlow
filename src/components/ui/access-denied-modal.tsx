'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'


interface AccessDeniedModalProps {
  open: boolean
  onClose: () => void
  permission: string
  onRequest: (reason: string) => void
  alreadyRequested: boolean
  blockedDefinitively: boolean
}

export function AccessDeniedModal({
  open,
  onClose,
  permission,
  onRequest,
  alreadyRequested,
  blockedDefinitively,
}: AccessDeniedModalProps) {
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  const handleRequest = async () => {
    if (!reason.trim()) return
    setSending(true)
    onRequest(reason.trim())
    setSending(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso Restrito</DialogTitle>
          <DialogDescription>
            {permission && (
              <span className="font-[500] text-[var(--accent)]">{permission}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {blockedDefinitively ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20">
              <svg className="w-5 h-5 text-[var(--destructive)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-[13px] text-[var(--text-2)]">
                Acesso bloqueado permanentemente para esta função. Entre em contato com o suporte.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Entendi
            </Button>
          </div>
        ) : alreadyRequested ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning)]/20">
              <svg className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-[13px] text-[var(--text-2)]">
                Você já solicitou acesso a esta função. Aguarde a aprovação.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <svg className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="text-[13px] text-[var(--text-2)]">
                Você não tem permissão para acessar esta função.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-[500] text-[var(--text-2)]">
                Por que você precisa deste acesso?
              </label>
              <Textarea
                placeholder="Descreva o motivo da solicitação..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleRequest} disabled={!reason.trim() || sending}>
                {sending ? 'Enviando...' : 'Solicitar Permissão'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
