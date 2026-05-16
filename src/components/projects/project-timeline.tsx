'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

export type NodeStatus = 'waiting' | 'in_progress' | 'paused' | 'completed'

interface TimelineNode {
  id: number
  label: string
  description: string
  status: NodeStatus
  timeEstimate?: string
  deadline?: string
  comments?: { text: string; author: string; time: string; type: 'text' | 'image' | 'video' }[]
}

interface ProjectTimelineProps {
  nodes: TimelineNode[]
  expandedNode: number | null
  onToggle: (id: number) => void
  onStatusChange?: (id: number, status: NodeStatus) => void
  onTimeChange?: (id: number, time: string) => void
  onAddComment?: (id: number, text: string) => void
  newComment: string
  onNewCommentChange: (text: string) => void
  className?: string
  session?: any
}

function getProgressColor(percent: number) {
  if (percent < 60) return 'var(--success)'
  if (percent < 85) return 'var(--warning)'
  return 'var(--destructive)'
}

function NodeIcon({ status }: { status: NodeStatus }) {
  const base = "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300"
  if (status === 'completed') return (
    <div className={cn(base, "bg-[var(--success)] border-[var(--success)]")}>
      <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5l2 2 4-4"/></svg>
    </div>
  )
  if (status === 'in_progress') return (
    <div className={cn(base, "bg-[var(--accent-subtle-2)] border-[var(--accent)]")}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--accent)]"><path d="M4 2l10 6-10 6V2z"/></svg>
    </div>
  )
  if (status === 'paused') return (
    <div className={cn(base, "bg-[var(--warning-subtle)] border-[var(--warning)]")}>
      <svg width="12" height="12" viewBox="0 0 8 8" fill="var(--warning)"><rect x="1" y="1" width="2" height="6" rx="0.5"/><rect x="5" y="1" width="2" height="6" rx="0.5"/></svg>
    </div>
  )
  return <div className={cn(base, "bg-transparent border-[var(--border-2)]")} />
}

function StatusLabel({ status }: { status: NodeStatus }) {
  const labels: Record<NodeStatus, { text: string; color: string; bg: string }> = {
    completed: { text: 'Concluido', color: 'var(--success)', bg: 'var(--success-subtle)' },
    in_progress: { text: 'Em andamento', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
    paused: { text: 'Pausado', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
    waiting: { text: 'Aguardando', color: 'var(--text-3)', bg: 'transparent' },
  }
  const l = labels[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[500]"
      style={{ color: l.color, background: l.bg, border: status === 'waiting' ? '1px solid var(--border)' : 'none' }}
    >
      {status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />}
      {l.text}
    </span>
  )
}

export function ProjectTimeline({
  nodes,
  expandedNode,
  onToggle,
  onStatusChange,
  onTimeChange,
  onAddComment,
  newComment,
  onNewCommentChange,
  className,
  session,
}: ProjectTimelineProps) {
  const completed = nodes.filter(n => n.status === 'completed')
  const active = nodes.find(n => n.status === 'in_progress' || n.status === 'paused')
  const pending = nodes.filter(n => n.status === 'waiting')

  const [extendOpen, setExtendOpen] = useState<string | null>(null)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendReason, setExtendReason] = useState('')

  const activeIndex = active ? nodes.findIndex(n => n.id === active.id) : -1
  const total = nodes.length

  const handleExtendDeadline = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!newDeadline || !extendReason.trim() || !node) return

    const step = nodes.find(n => n.id === nodeId)
    if (onTimeChange) onTimeChange(nodeId, newDeadline)
    toast.success(`Prazo de "${step?.label}" estendido para ${new Date(newDeadline).toLocaleDateString('pt-BR')}`)

    setExtendOpen(null)
    setNewDeadline('')
    setExtendReason('')
  }

  return (
    <div className={cn('space-y-4', className)}>
      {active && onStatusChange && (
        <div className="p-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-subtle)]/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[12px] font-[500] text-[var(--accent)] uppercase tracking-wider">
                Etapa Atual {activeIndex >= 0 && `[${activeIndex + 1}/${total}]`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: i < activeIndex ? 'var(--success)' : i === activeIndex ? 'var(--accent)' : 'var(--border-2)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
            <div className="flex items-start gap-3">
              <NodeIcon status={active.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-[500] text-[var(--text)]">{active.label}</span>
                  <StatusLabel status={active.status} />
                </div>
                <p className="text-[12px] text-[var(--text-3)] mb-3">{active.description}</p>

                {active.timeEstimate && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[var(--text-3)]">Prazo: {active.timeEstimate}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, 40)}%`,
                          background: getProgressColor(40),
                        }}
                      />
                    </div>
                  </div>
                )}

                {active.comments && active.comments.length > 0 && (
                  <div className="space-y-1.5 bg-[var(--surface-hover)] rounded-lg p-2.5 mb-3">
                    {active.comments.map((c, ci) => (
                      <div key={ci} className="text-[12px]">
                        <span className="font-[500] text-[var(--accent)]">{c.author}</span>
                        <span className="text-[var(--text-3)] ml-1">{c.time}</span>
                        <p className="mt-0.5 text-[var(--text-2)]">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {onAddComment && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <input
                      placeholder="Escrever..."
                      value={newComment}
                      onChange={e => onNewCommentChange(e.target.value)}
                      className="h-7 text-[11px] flex-1"
                      onKeyDown={e => { if (e.key === 'Enter' && newComment.trim()) onAddComment(active.id, newComment) }}
                    />
                    <button
                      onClick={() => { if (newComment.trim()) onAddComment(active.id, newComment) }}
                      disabled={!newComment.trim()}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2l12 6L3 14l3-6-3-6z"/></svg>
                    </button>
                  </div>
                )}

                {onStatusChange && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {active.status !== 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => onStatusChange(active.id, 'in_progress')}
                        className="h-7 text-[11px] bg-[var(--accent)]"
                      >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
                        {active.status === 'paused' ? 'Retomar' : 'Iniciar'}
                      </Button>
                    )}
                    {active.status === 'in_progress' && (
                      <Button size="sm" variant="outline" onClick={() => onStatusChange(active.id, 'paused')} className="h-7 text-[11px]">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3" height="12" rx="0.5"/><rect x="10" y="2" width="3" height="12" rx="0.5"/></svg>
                        Pausar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onStatusChange(active.id, 'completed')} className="h-7 text-[11px] text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success-subtle)]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5l2 2 4-4"/></svg>
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-[var(--warning)]"
                      onClick={() => {
                        setExtendOpen(active.id.toString())
                        setNewDeadline(active.timeEstimate || new Date().toISOString().split('T')[0])
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                      Estender Prazo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
          <span className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-2 block">
            Concluido
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {completed.map(n => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[var(--success-subtle)]"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--success)" strokeWidth="1.5"><path d="M2 5l2 2 4-4"/></svg>
                <span className="text-[var(--success)] font-[500]">{n.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
          <span className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-2 block">
            Proximas Etapas
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {pending.map(n => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-[var(--border-2)]"
              >
                <span className="h-1.5 w-1.5 rounded-full border border-[var(--border-2)]" />
                <span className="text-[var(--text-2)]">{n.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!extendOpen} onOpenChange={(v) => { if (!v) setExtendOpen(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Estender Prazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-[var(--text-2)]">
              Informe a nova data de conclusao para esta etapa:
            </p>
            <div className="space-y-2">
              <label>Nova data</label>
              <Input
                type="date"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label>Motivo do atraso (sera enviado ao cliente)</label>
              <textarea
                className="w-full h-20 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-none"
                placeholder="Descreva o motivo do atraso..."
                value={extendReason}
                onChange={e => setExtendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(null)}>Cancelar</Button>
            <Button onClick={() => { if (extendOpen) handleExtendDeadline(parseInt(extendOpen)) }}>
              Confirmar novo prazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
