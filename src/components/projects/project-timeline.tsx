'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export type NodeStatus = 'waiting' | 'in_progress' | 'paused' | 'completed'

interface CommentFile {
  name: string
  size: number
  type: string
  url: string
}

interface TimelineNode {
  id: number
  label: string
  description: string
  status: NodeStatus
  timeEstimate?: string
  deadline?: string
  comments?: { text: string; author: string; time: string; type: 'text' | 'image' | 'video'; files?: CommentFile[] }[]
}

interface ProjectTimelineProps {
  nodes: TimelineNode[]
  expandedNode: number | null
  onToggle: (id: number) => void
  onStatusChange?: (id: number, status: NodeStatus) => void
  onTimeChange?: (id: number, time: string) => void
  onAddComment?: (id: number, text: string, files?: CommentFile[]) => void
  newComment: string
  onNewCommentChange: (text: string) => void
  className?: string
  session?: any
  projectStatus?: string
  stepActions?: (nodeId: number) => React.ReactNode
}

function getProgressColor(percent: number) {
  if (percent < 60) return 'var(--success)'
  if (percent < 85) return 'var(--warning)'
  return 'var(--destructive)'
}

function NodeIcon({ status, nodeId }: { status: NodeStatus; nodeId: number }) {
  const base = "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 animate-scale-in"
  const key = `${nodeId}-${status}`
  if (status === 'completed') return (
    <div key={key} className={cn(base, "bg-[var(--success)] border-[var(--success)]")}>
      <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5l2 2 4-4"/></svg>
    </div>
  )
  if (status === 'in_progress') return (
    <div key={key} className={cn(base, "bg-[var(--accent-subtle-2)] border-[var(--accent)]")}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--accent)]"><path d="M4 2l10 6-10 6V2z"/></svg>
    </div>
  )
  if (status === 'paused') return (
    <div key={key} className={cn(base, "bg-[var(--warning-subtle)] border-[var(--warning)]")}>
      <svg width="12" height="12" viewBox="0 0 8 8" fill="var(--warning)"><rect x="1" y="1" width="2" height="6" rx="0.5"/><rect x="5" y="1" width="2" height="6" rx="0.5"/></svg>
    </div>
  )
  return <div key={key} className={cn(base, "bg-transparent border-[var(--border-2)]")} />
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
  projectStatus,
  stepActions,
}: ProjectTimelineProps) {
  const completed = nodes.filter(n => n.status === 'completed')
  const active = nodes.find(n => n.status === 'in_progress' || n.status === 'paused')
  const pending = nodes.filter(n => n.status === 'waiting')

  const [extendOpen, setExtendOpen] = useState<string | null>(null)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendReason, setExtendReason] = useState('')
  const [expandedCompleted, setExpandedCompleted] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<{ name: string; size: number; type: string; url: string }[]>([])
  const [viewerFile, setViewerFile] = useState<{ name: string; url: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatSmartTime = (dateTimeStr: string) => {
    if (!dateTimeStr.includes('/')) return dateTimeStr
    const parts = dateTimeStr.split(', ')
    if (parts.length < 2) return dateTimeStr
    const [datePart, timePart] = parts
    const [day, month, year] = datePart.split('/').map(Number)
    if (!day || !month || !year) return dateTimeStr
    const entryDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    entryDate.setHours(0, 0, 0, 0)
    const timeShort = timePart.split(':').slice(0, 2).join(':')
    if (entryDate.getTime() === today.getTime()) return `Hoje ${timeShort}`
    if (entryDate.getTime() === yesterday.getTime()) return `Ontem ${timeShort}`
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')} ${timeShort}`
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const readers: Promise<{ name: string; size: number; type: string; url: string }>[] = []
    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede 10MB`)
        return
      }
      readers.push(new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, url: reader.result as string })
        reader.readAsDataURL(file)
      }))
    })
    Promise.all(readers).then(newFiles => {
      if (newFiles.length > 0) {
        setPendingFiles(prev => [...prev, ...newFiles])
      }
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSendComment = (stepId: number) => {
    if (!newComment.trim() && pendingFiles.length === 0) return
    onAddComment?.(stepId, newComment, pendingFiles.length > 0 ? pendingFiles : undefined)
    setPendingFiles([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const isImage = (type: string) => type.startsWith('image/')
  const isVideo = (type: string) => type.startsWith('video/')
  const isAudio = (type: string) => type.startsWith('audio/')

  const renderCommentContent = (c: { text: string; author: string; time: string; type: string; files?: { name: string; size: number; type: string; url: string }[] }) => (
    <div>
      {c.text && <p className="text-[12px] text-[var(--text-2)] whitespace-pre-wrap break-words">{c.text.replace(/^\[SOL\. DADOS\]\s*/, '').replace(/^\[RESPOSTA\]\s*/, '')}</p>}
      {c.files && c.files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {c.files.map((f, fi) => (
            <button
              key={fi}
              onClick={() => setViewerFile({ name: f.name, url: f.url, type: f.type })}
              className="group relative flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-left max-w-[220px]"
            >
              {isImage(f.type) ? (
                <img src={f.url} alt={f.name} className="h-8 w-8 rounded object-cover shrink-0" />
              ) : isAudio(f.type) ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)] shrink-0"><path d="M2 10V6a4 4 0 016.93-2.3M13 10V3l-4 2v6"/><rect x="1" y="9" width="3" height="5" rx="0.5"/><rect x="12" y="8" width="3" height="7" rx="0.5"/></svg>
              ) : isVideo(f.type) ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--warning)] shrink-0"><polygon points="2,2 14,8 2,14" fill="currentColor" opacity="0.3"/><polygon points="2,2 14,8 2,14" fill="none"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-3)] shrink-0"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v4h4"/></svg>
              )}
              <span className="text-[10px] text-[var(--text-2)] truncate flex-1">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const activeIndex = active ? nodes.findIndex(n => n.id === active.id) : -1
  const total = nodes.length

  const handleExtendDeadline = (nodeId: number) => {
    const step = nodes.find(n => n.id === nodeId)
    if (!newDeadline || !extendReason.trim() || !step) return

    if (onTimeChange) onTimeChange(nodeId, newDeadline)

    const toastMsg = `Prazo de "${step.label}" estendido para ${new Date(newDeadline + 'T00:00:00').toLocaleDateString('pt-BR')}`
    toast.success(toastMsg)

    setExtendOpen(null)
    setNewDeadline('')
    setExtendReason('')
  }

  return (
    <div className={cn('space-y-4', className)}>
      {active && (
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

          <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 transition-all duration-[400ms] ease-[cubic-bezier(0.2,0,0,1)] animate-fade-up">
            <div className="flex items-start gap-3">
              <NodeIcon status={active.status} nodeId={active.id} />
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
                  <div className="space-y-2 mb-3">
                    {active.comments.map((c, ci) => {
                      const isSolDados = c.text.startsWith('[SOL. DADOS]')
                      const isResposta = c.text.startsWith('[RESPOSTA]')
                      const isMine = c.author === session?.user?.name
                      return (
                        <div key={ci} className={`flex group ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 relative ${
                            isSolDados ? 'bg-[var(--info-subtle)] border border-[var(--info)]/20 rounded-tl-sm' :
                            isResposta ? 'bg-[var(--success-subtle)] border border-[var(--success)]/20 rounded-tr-sm' :
                            isMine ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-br-sm' :
                            'bg-[var(--surface-hover)] border border-[var(--border)] rounded-bl-sm'
                          }`}>
                            <span className="text-[10px] font-[600] text-[var(--accent)]">{c.author}</span>
                            <div className="mt-0.5">{renderCommentContent(c)}</div>
                            <span className="absolute -bottom-4 right-1 text-[9px] text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{formatSmartTime(c.time)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {onAddComment && (
                  <div className="space-y-2 mb-3">
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pendingFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--info-subtle)] text-[10px]">
                            <span className="truncate max-w-[100px]">{f.name}</span>
                            <span className="text-[var(--text-3)]">{formatFileSize(f.size)}</span>
                            <button onClick={() => removePendingFile(i)} className="text-[var(--text-3)] hover:text-[var(--destructive)] ml-0.5">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFilesSelected} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
                      <button onClick={() => fileInputRef.current?.click()} className="h-7 w-7 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-3)] transition-colors shrink-0" title="Anexar arquivo">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 9.5V12a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 12V6A1.5 1.5 0 013 4.5h2.5M8 11V3M8 3L5.5 5.5M8 3l2.5 2.5"/></svg>
                      </button>
                      <input
                        placeholder="Escrever..."
                        value={newComment}
                        onChange={e => onNewCommentChange(e.target.value)}
                        className="h-7 text-[11px] flex-1 bg-transparent border-none outline-none placeholder:text-[var(--text-3)]"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(active.id) } }}
                      />
                      <button
                        onClick={() => handleSendComment(active.id)}
                        disabled={!newComment.trim() && pendingFiles.length === 0}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2l12 6L3 14l3-6-3-6z"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {stepActions && stepActions(active.id) && (
                  <div className="mb-3">{stepActions(active.id)}</div>
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
          <div className="space-y-1.5">
            {completed.map(n => {
              const isExpanded = expandedCompleted === n.id
              return (
                <div key={n.id} id={`step-${n.id}`}>
                  <button
                    onClick={() => setExpandedCompleted(isExpanded ? null : n.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors text-left group"
                  >
                    <NodeIcon status={n.status} nodeId={n.id} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-[500] text-[var(--text)]">{n.label}</span>
                        <StatusLabel status={n.status} />
                      </div>
                      <p className="text-[12px] text-[var(--text-3)] truncate">{n.description}</p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                      className={`transition-transform text-[var(--text-3)] ${isExpanded ? 'rotate-180' : ''}`}>
                      <path d="M4 6l4 4 4-4"/>
                    </svg>
                  </button>
                  {isExpanded && n.comments && n.comments.length > 0 && (
                    <div className="ml-10 mt-1 mb-2 space-y-2 px-1 animate-expand">
                      {n.comments.map((c, ci) => {
                        const isSolDados = c.text.startsWith('[SOL. DADOS]')
                        const isResposta = c.text.startsWith('[RESPOSTA]')
                        const isMine = c.author === session?.user?.name
                        return (
                          <div key={ci} className={`flex group ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 relative ${
                              isSolDados ? 'bg-[var(--info-subtle)] border border-[var(--info)]/20 rounded-tl-sm' :
                              isResposta ? 'bg-[var(--success-subtle)] border border-[var(--success)]/20 rounded-tr-sm' :
                              isMine ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-br-sm' :
                              'bg-[var(--surface-hover)] border border-[var(--border)] rounded-bl-sm'
                            }`}>
                              <span className="text-[10px] font-[600] text-[var(--accent)]">{c.author}</span>
                              <div className="mt-0.5">{renderCommentContent(c)}</div>
                              <span className="absolute -bottom-4 right-1 text-[9px] text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{formatSmartTime(c.time)}</span>
                            </div>
                          </div>


                          )
                      })}
                    </div>
                  )}
                  {isExpanded && stepActions && stepActions(n.id) && (
                    <div className="ml-10 mt-1 mb-2">{stepActions(n.id)}</div>
                  )}
                  {isExpanded && (!n.comments || n.comments.length === 0) && (
                    <div className="ml-10 mt-1 mb-2 p-2.5 rounded-lg bg-[var(--surface)] animate-expand">
                      <p className="text-[12px] text-[var(--text-3)]">Nenhum registro de atividade nesta etapa</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
          <span className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-2 block">
            {active ? 'Proximas Etapas' : 'Etapas Pendentes'}
          </span>
          {!active && onStatusChange ? (
            <div className="space-y-2">
              {pending.map(n => {
                const isLocked = n.id > 3 && projectStatus !== 'IN_PROGRESS'
                const isProposta = n.id === 2
                const isContrato = n.id === 3
                return (
                <div
                  key={n.id}
                  id={`step-${n.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border animate-card-pop ${
                    isLocked ? 'bg-[var(--surface-2)] border-[var(--border)] opacity-60' : 'bg-[var(--surface)] border-[var(--border)]'
                  }`}
                >
                  <NodeIcon status={n.status} nodeId={n.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-[500] text-[var(--text)]">{n.label}</span>
                      <StatusLabel status={n.status} />
                    </div>
                    {isLocked ? (
                      <p className="text-[11px] text-[var(--warning)] mt-0.5">Aguardando assinatura do contrato pelo cliente</p>
                    ) : isProposta && projectStatus !== 'REVIEW' ? (
                      <p className="text-[11px] text-[var(--info)] mt-0.5">Aguardando envio da proposta pelo desenvolvedor</p>
                    ) : (
                      <p className="text-[12px] text-[var(--text-3)] mt-0.5">{n.description}</p>
                    )}
                    {n.timeEstimate && (
                      <p className="text-[10px] text-[var(--text-2)] mt-1 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
                        Prazo: {n.timeEstimate}
                      </p>
                    )}
                    {stepActions && stepActions(n.id) && (
                      <div className="mt-2">{stepActions(n.id)}</div>
                    )}
                  </div>
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--warning-subtle)] text-[var(--warning)]">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="10" height="6" rx="1"/><path d="M8 2v5"/><circle cx="8" cy="9" r="0.5" fill="currentColor"/></svg>
                      Bloqueado
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => onStatusChange(n.id, 'in_progress')} className="h-7 text-[11px] bg-[var(--accent)]">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
                      Iniciar
                    </Button>
                  )}
                </div>
              )})}
            </div>
          ) : (
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
          )}
        </div>
      )}

      <Dialog open={!!viewerFile} onOpenChange={() => setViewerFile(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-[var(--bg)]">
          {viewerFile && (
            <div className="flex flex-col h-full max-h-[85vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-3)] shrink-0"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v4h4"/></svg>
                  <span className="text-[13px] font-[500] text-[var(--text)] truncate">{viewerFile.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={viewerFile.url} download={viewerFile.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3M4 6l4 4 4-4M8 10V2"/></svg>
                    Baixar
                  </a>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                {isImage(viewerFile.type) ? (
                  <img src={viewerFile.url} alt={viewerFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                ) : isVideo(viewerFile.type) ? (
                  <video src={viewerFile.url} controls className="max-w-full max-h-[70vh] rounded-lg" autoPlay />
                ) : isAudio(viewerFile.type) ? (
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--accent)]"><path d="M2 10V6a4 4 0 016.93-2.3M13 10V3l-4 2v6"/><rect x="1" y="9" width="3" height="5" rx="0.5"/><rect x="12" y="8" width="3" height="7" rx="0.5"/></svg>
                    </div>
                    <p className="text-[13px] text-[var(--text)]">{viewerFile.name}</p>
                    <audio src={viewerFile.url} controls className="w-full max-w-md mx-auto" autoPlay />
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <svg width="48" height="48" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-3)] mx-auto"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v4h4"/></svg>
                    <p className="text-[13px] text-[var(--text-2)]">Arquivo: {viewerFile.name}</p>
                    <p className="text-[11px] text-[var(--text-3)]">Use o botao acima para baixar</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
