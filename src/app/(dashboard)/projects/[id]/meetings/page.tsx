'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Calendar, Mic, Bot, CheckCircle2, Clock, User, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface MeetingData {
  id: string
  title: string
  date: string
  transcript: string | null
  summary: string | null
  actions: any
  audioUrl: string | null
  project: { id: string; name: string }
}

export default function MeetingsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const [meetings, setMeetings] = useState<MeetingData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', transcript: '' })
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchMeetings = useCallback(() => {
    fetch(`/api/meetings?projectId=${id}`)
      .then(r => r.json())
      .then(json => { setMeetings(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchMeetings() }, [id, fetchMeetings])

  const handleCreate = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, title: form.title, date: form.date, transcript: form.transcript || undefined }),
    })
    if (res.ok) {
      toast.success('Reuniao criada')
      setShowNew(false)
      setForm({ title: '', date: '', transcript: '' })
      fetchMeetings()
    } else {
      toast.error('Erro ao criar reuniao')
    }
    setSaving(false)
  }

  const handleTranscribe = async (meetingId: string, transcriptText: string) => {
    if (!transcriptText.trim()) {
      toast.error('Adicione a transcricao primeiro')
      return
    }
    setProcessingId(meetingId)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Transcricao processada com IA')
        fetchMeetings()
      } else {
        toast.error(json.error || 'Erro ao processar')
      }
    } catch {
      toast.error('Erro ao processar transcricao')
    }
    setProcessingId(null)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium flex items-center gap-2">
              <Mic className="h-5 w-5 text-[var(--accent)]" /> Reunioes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{meetings.length} reunioes registradas</p>
          </div>
        </div>
        {roleLevel >= 40 && (
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Nova Reuniao
          </Button>
        )}
      </div>

      {meetings.length === 0 && (
        <p className="text-center py-12 text-[var(--text-3)]">Nenhuma reuniao registrada neste projeto</p>
      )}

      <div className="space-y-4">
        {meetings.map(meeting => {
          const actionsList = meeting.actions ? (Array.isArray(meeting.actions) ? meeting.actions : []) : []
          return (
            <Card key={meeting.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[14px] font-[500]">{meeting.title}</p>
                    <p className="text-[11px] text-[var(--text-3)] flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {new Date(meeting.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {meeting.summary && (
                    <Badge variant="success" className="text-[10px]">Processada com IA</Badge>
                  )}
                </div>

                {meeting.transcript && !meeting.summary && (
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <p className="text-[11px] text-[var(--text-3)] mb-1.5">Transcricao registrada:</p>
                    <p className="text-[12px] text-[var(--text)] whitespace-pre-wrap line-clamp-4">{meeting.transcript}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-[11px] gap-1"
                      onClick={() => handleTranscribe(meeting.id, meeting.transcript!)}
                      disabled={processingId === meeting.id}
                    >
                      {processingId === meeting.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                      Processar com IA
                    </Button>
                  </div>
                )}

                {!meeting.transcript && (
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <p className="text-[11px] text-[var(--text-3)]">Sem transcricao. Adicione o texto para processar com IA.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-[11px] gap-1"
                      onClick={() => {
                        const transcript = prompt('Cole a transcricao da reuniao:')
                        if (transcript) handleTranscribe(meeting.id, transcript)
                      }}
                    >
                      <Mic className="h-3 w-3" /> Adicionar transcricao
                    </Button>
                  </div>
                )}

                {meeting.summary && (
                  <>
                    <div className="p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
                      <p className="text-[10px] text-[var(--info)] font-[500] uppercase tracking-wider mb-1">Resumo Executivo</p>
                      <p className="text-[12px] text-[var(--text)] whitespace-pre-wrap">{meeting.summary}</p>
                    </div>

                    {actionsList.length > 0 && (
                      <div>
                        <p className="text-[11px] font-[500] text-[var(--text-2)] mb-1.5">Acoes Extraidas:</p>
                        <div className="space-y-1.5">
                          {actionsList.map((action: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                              <span className="flex-1">{action.action}</span>
                              {action.assignee && (
                                <span className="flex items-center gap-1 text-[var(--text-3)]">
                                  <User className="h-3 w-3" /> {action.assignee}
                                </span>
                              )}
                              {action.dueDate && (
                                <span className="flex items-center gap-1 text-[var(--text-3)]">
                                  <Clock className="h-3 w-3" /> {action.dueDate}
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] text-[var(--accent)]"
                                onClick={async () => {
                                  const res = await fetch('/api/tasks', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: action.action,
                                      description: `Extraido da reuniao: ${meeting.title}`,
                                      projectId: id,
                                      assigneeId: null,
                                      dueDate: action.dueDate ? new Date(action.dueDate).toISOString() : null,
                                    }),
                                  })
                                  if (res.ok) toast.success('Tarefa criada!')
                                  else toast.error('Erro ao criar tarefa')
                                }}
                              >
                                <Plus className="h-3 w-3 mr-0.5" /> Task
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Reuniao</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-2)]">Titulo</label>
              <Input placeholder="Ex: Sprint planning" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-2)]">Data</label>
              <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--text-2)]">Transcricao (opcional)</label>
              <textarea
                className="w-full min-h-[100px] rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Cole a transcricao da reuniao aqui..."
                value={form.transcript}
                onChange={e => setForm({ ...form, transcript: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title || !form.date}>
              {saving ? 'Criando...' : 'Criar Reuniao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
