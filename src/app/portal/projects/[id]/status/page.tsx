'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowLeft, MessageSquare, TicketIcon, Clock, CheckCircle,
  CalendarDays, Users, RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProjectStatusPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [projRes, updRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/project-updates?projectId=${projectId}`),
    ])
    const proj = await projRes.json()
    const upd = await updRes.json()
    setProject(proj.data)
    setUpdates((upd.data || []).slice(0, 3))
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval) }, [projectId, fetchData])

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  if (!project) return <div className="p-6 text-center text-muted-foreground">Projeto nao encontrado</div>

  const totalTasks = project._count?.tasks || 0
  const doneTasks = project.tasks?.filter((t: any) => t.status === 'DONE').length || 0
  const openTickets = 0
  const daysRemaining = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000) : null
  const nextMilestone = project.milestones?.find((m: any) => m.status !== 'COMPLETED')

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text)] mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold">{project.name}</h1>
                <Badge variant="secondary" className="mt-1">{project.status}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4">
            <CheckCircle className="h-4 w-4 text-success mb-2" />
            <p className="text-2xl font-semibold">{doneTasks}/{totalTasks}</p>
            <p className="text-xs text-muted-foreground">Tarefas</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <Clock className={`h-4 w-4 mb-2 ${daysRemaining !== null && daysRemaining < 7 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className={`text-2xl font-semibold ${daysRemaining !== null && daysRemaining < 7 ? 'text-destructive' : ''}`}>
              {daysRemaining !== null ? `${daysRemaining}d` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Dias restantes</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <TicketIcon className="h-4 w-4 text-warning mb-2" />
            <p className="text-2xl font-semibold">{openTickets}</p>
            <p className="text-xs text-muted-foreground">Tickets abertos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <CalendarDays className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-semibold">{nextMilestone?.title || '-'}</p>
            <p className="text-xs text-muted-foreground">Proxima entrega</p>
          </CardContent></Card>
        </div>

        {/* Team */}
        {project.tasks && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Equipe</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Array.from(new Set(project.tasks.filter((t: any) => t.assignee).map((t: any) => t.assignee.id))).map((id: any) => {
                  const assignee = project.tasks.find((t: any) => t.assignee?.id === id)?.assignee
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)]">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-2xs">{assignee?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                      <span className="text-xs">{assignee?.name}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest updates */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Ultimas Atualizacoes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {updates.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma atualizacao recente</p>}
            {updates.map((u: any) => (
              <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.description}</p>
                  <p className="text-2xs text-[var(--text-3)] mt-1">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => router.push('/portal/chat')}>
            <MessageSquare className="h-4 w-4" /> Enviar mensagem
          </Button>
          <Button className="flex-1 gap-2" onClick={() => router.push('/portal/tickets/new')}>
            <TicketIcon className="h-4 w-4" /> Abrir ticket
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
