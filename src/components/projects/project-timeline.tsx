'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type NodeStatus = 'waiting' | 'in_progress' | 'paused' | 'completed'

interface TimelineNode {
  id: number
  label: string
  description: string
  status: NodeStatus
  timeEstimate?: string
  timestamp?: string
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
}

function NodeIcon({ status }: { status: NodeStatus }) {
  const base = "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300"
  if (status === 'completed') return (
    <div className={cn(base, "bg-[var(--success)] border-[var(--success)]")}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5l2 2 4-4"/></svg>
    </div>
  )
  if (status === 'in_progress') return (
    <div className={cn(base, "bg-[var(--accent-subtle-2)] border-[var(--accent)]")}>
      <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
    </div>
  )
  if (status === 'paused') return (
    <div className={cn(base, "bg-[var(--warning-subtle)] border-[var(--warning)]")}>
      <svg width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="2" height="6" rx="0.5" fill="var(--warning)"/><rect x="5" y="1" width="2" height="6" rx="0.5" fill="var(--warning)"/></svg>
    </div>
  )
  return <div className={cn(base, "bg-transparent border-[var(--border-2)]")} />
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
}: ProjectTimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {nodes.map((node, i) => {
        const isExpanded = expandedNode === node.id
        const isLast = i === nodes.length - 1

        return (
          <div key={node.id} className="relative">
            <div className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 w-5">
                <NodeIcon status={node.status} />
                {!isLast && (
                  <div className="w-px flex-1 min-h-[16px] my-1 bg-[var(--border)]" />
                )}
              </div>

              <div className="flex-1 pb-6">
                <button
                  onClick={() => onToggle(node.id)}
                  className="w-full flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'text-[13px] font-[500]',
                      node.status === 'completed' ? 'text-[var(--text-2)]' : 'text-[var(--text)]'
                    )}>
                      {node.label}
                    </span>
                    {node.timestamp && (
                      <span className="text-[11px] text-[var(--text-3)] shrink-0">{node.timestamp}</span>
                    )}
                    {node.timeEstimate && (
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1 shrink-0">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                        {node.timeEstimate}
                      </span>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn(
                    'transition-transform duration-150 text-[var(--text-3)]',
                    isExpanded && 'rotate-180'
                  )}>
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-0 space-y-2.5 animate-fade-in">
                    <p className="text-[12px] text-[var(--text-3)]">{node.description}</p>

                    {onStatusChange && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onStatusChange(node.id, 'in_progress')}
                          className={cn(
                            'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-[450] transition-colors',
                            node.status === 'in_progress'
                              ? 'bg-[var(--accent)] text-white'
                              : 'border border-[var(--border-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.15)]'
                          )}
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
                          Iniciar
                        </button>
                        <button
                          onClick={() => onStatusChange(node.id, 'paused')}
                          className={cn(
                            'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-[450] transition-colors',
                            node.status === 'paused'
                              ? 'bg-[var(--surface-3)] text-[var(--text)]'
                              : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                          )}
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3" height="12" rx="0.5"/><rect x="10" y="2" width="3" height="12" rx="0.5"/></svg>
                          Pausar
                        </button>
                        <button
                          onClick={() => onStatusChange(node.id, 'completed')}
                          className={cn(
                            'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-[450] transition-colors',
                            node.status === 'completed'
                              ? 'bg-[var(--success)] text-white'
                              : 'border border-[var(--border-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.15)]'
                          )}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5l2 2 4-4"/></svg>
                          Concluir
                        </button>
                        {onTimeChange && (
                          <div className="flex items-center gap-1 ml-1">
                            <input
                              placeholder="Tempo"
                              value={node.timeEstimate || ''}
                              onChange={e => onTimeChange(node.id, e.target.value)}
                              className="h-7 text-[11px] w-[100px]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {node.comments && node.comments.length > 0 && (
                      <div className="space-y-1.5 bg-[var(--surface-hover)] rounded-lg p-2.5">
                        {node.comments.map((c, ci) => (
                          <div key={ci} className="text-[12px]">
                            <span className="font-[500] text-[var(--text)]">{c.author}</span>
                            <span className="text-[var(--text-3)] ml-1">- {c.time}</span>
                            <p className="mt-0.5 text-[var(--text-2)]">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {onAddComment && (
                      <div className="flex items-center gap-1.5">
                        <input
                          placeholder="Comentario..."
                          value={newComment}
                          onChange={e => onNewCommentChange(e.target.value)}
                          className="h-7 text-[11px] flex-1"
                          onKeyDown={e => { if (e.key === 'Enter' && newComment.trim()) onAddComment(node.id, newComment) }}
                        />
                        <button
                          onClick={() => { if (newComment.trim()) onAddComment(node.id, newComment) }}
                          disabled={!newComment.trim()}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2l12 6L3 14l3-6-3-6z"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
