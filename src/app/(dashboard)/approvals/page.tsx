'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { IconLoader } from '@/components/icons'
import { ClipboardList, Check, X, Filter } from 'lucide-react'

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionModal, setActionModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchApprovals = useCallback(() => {
    setLoading(true)
    fetch(`/api/approvals?status=${filter}`)
      .then(r => r.json())
      .then(json => { setApprovals(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchApprovals() }, [filter, fetchApprovals])

  const handleAction = async () => {
    if (!actionModal) return
    setActionLoading(true)
    const res = await fetch('/api/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: actionModal.id, action: actionModal.action, comment }),
    })
    if (res.ok) {
      toast.success(actionModal.action === 'approve' ? 'Aprovado com sucesso!' : 'Rejeitado')
      fetchApprovals()
      setActionModal(null)
      setComment('')
    } else {
      const json = await res.json()
      toast.error(json.error || 'Erro')
    }
    setActionLoading(false)
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em] flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Aprovacoes
          </h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            {pendingCount} pendencia{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--text-3)]" />
          <select
            className="h-8 text-[12px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : approvals.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-[var(--text-3)]">Nenhuma aprovacao encontrada</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {approvals.map((approval: any) => (
            <Card key={approval.id} className={`${
              approval.status === 'approved' ? 'border-l-[3px] border-l-[var(--success)]' :
              approval.status === 'rejected' ? 'border-l-[3px] border-l-[var(--destructive)]' :
              'border-l-[3px] border-l-[var(--warning)]'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={approval.status === 'approved' ? 'COMPLETED' : approval.status === 'rejected' ? 'CANCELLED' : 'REVIEW'}>
                        {approval.status === 'approved' ? 'Aprovado' : approval.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                      <span className="text-[10px] font-[500] text-[var(--text-3)] uppercase">
                        {approval.entityType === 'project' ? 'Projeto' : approval.entityType === 'invoice' ? 'Fatura' : 'Contrato'}
                      </span>
                    </div>
                    <p className="text-[14px] font-[500] text-[var(--text)]">{approval.entityName}</p>
                    {approval.entityDetail && (
                      <p className="text-[11px] text-[var(--text-2)] mt-0.5">{approval.entityDetail}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-3)] mt-2">
                      <span>Aprovador: {approval.requiredByName}</span>
                      <span>{new Date(approval.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {approval.comment && (
                      <p className="text-[11px] text-[var(--text-2)] mt-1 bg-[var(--surface-2)] rounded p-2">{approval.comment}</p>
                    )}
                  </div>
                  {approval.status === 'pending' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => setActionModal({ id: approval.id, action: 'approve' })}
                        className="h-7 text-[11px] bg-[var(--success)] hover:bg-[var(--success)]">
                        <Check className="h-3 w-3 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActionModal({ id: approval.id, action: 'reject' })}
                        className="h-7 text-[11px] text-[var(--destructive)] border-[var(--destructive)]/30">
                        <X className="h-3 w-3 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal?.action === 'approve' ? 'Confirmar Aprovacao' : 'Confirmar Rejeicao'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-[13px] text-[var(--text-2)]">
              {actionModal?.action === 'approve'
                ? 'Voce esta prestes a aprovar esta solicitacao.'
                : 'Tem certeza que deseja rejeitar esta solicitacao?'}
            </p>
            <div>
              <label className="text-[11px] text-[var(--text-3)] block mb-1">Comentario (opcional)</label>
              <textarea
                className="w-full min-h-[60px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Adicione um comentario..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancelar</Button>
            <Button onClick={handleAction} disabled={actionLoading}
              className={actionModal?.action === 'approve' ? 'bg-[var(--success)] hover:bg-[var(--success)]' : 'bg-[var(--destructive)] hover:bg-[var(--destructive)]'}>
              {actionLoading && <IconLoader className="w-[14px] h-[14px] animate-spin mr-1" />}
              {actionModal?.action === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
