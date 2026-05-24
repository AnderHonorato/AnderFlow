'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Users, Clock, AlertTriangle, CheckCircle2, Ticket, FolderKanban, ArrowUpDown, RefreshCcw } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  position: string | null
  isOnline: boolean
  lastSeen: string | null
  metrics: {
    projects: { id: string; name: string }[]
    openTickets: number
    totalTasks: number
    overdueTasks: number
    todayTasks: number
    weeklyHours: number
  }
}

export default function TeamPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [redistributing, setRedistributing] = useState(false)
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null)
  const [redistributeTaskId, setRedistributeTaskId] = useState<string | null>(null)
  const [tasksList, setTasksList] = useState<any[]>([])

  useEffect(() => {
    if (roleLevel < 80) {
      router.push('/dashboard')
      return
    }
    fetch('/api/team/overview')
      .then(r => r.json())
      .then(json => { setMembers(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [roleLevel, router])

  const loadTasks = async (userId: string) => {
    const res = await fetch(`/api/tasks?assigneeId=${userId}&status=TODO,IN_PROGRESS`)
    const json = await res.json()
    setTasksList(json.data || [])
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: 'Dono', ADMIN: 'Admin', DEVELOPER: 'Dev', MODERATOR: 'Moderador',
    }
    return labels[role] || role
  }

  const getWorkloadColor = (member: TeamMember) => {
    const { totalTasks, overdueTasks } = member.metrics
    if (totalTasks === 0) return 'text-[var(--success)]'
    const ratio = overdueTasks / totalTasks
    if (ratio >= 0.5) return 'text-[var(--destructive)]'
    if (ratio >= 0.25) return 'text-[var(--warning)]'
    return 'text-[var(--success)]'
  }

  const getWorkloadLabel = (member: TeamMember) => {
    const { totalTasks, overdueTasks } = member.metrics
    if (totalTasks === 0) return 'Disponivel'
    const ratio = overdueTasks / totalTasks
    if (ratio >= 0.5) return 'Sobrecarregado'
    if (ratio >= 0.25) return 'Ocupado'
    return 'Ok'
  }

  if (loading) {
    return <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-44" />)}</div>
    </div>
  }

  const sortedByWorkload = [...members].sort((a, b) => {
    const ratioA = a.metrics.totalTasks > 0 ? a.metrics.overdueTasks / a.metrics.totalTasks : -1
    const ratioB = b.metrics.totalTasks > 0 ? b.metrics.overdueTasks / b.metrics.totalTasks : -1
    return ratioB - ratioA
  })

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            Equipe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} membros</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetch('/api/team/overview').then(r => r.json()).then(json => { setMembers(json.data || []); setLoading(false) }) }}>
          <RefreshCcw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map(member => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback className="text-xs bg-[var(--accent-subtle)] text-[var(--accent)]">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-[500]">{member.name}</p>
                    <p className="text-[11px] text-[var(--text-3)]">{getRoleLabel(member.role)}{member.position ? ` — ${member.position}` : ''}</p>
                  </div>
                </div>
                <Badge variant={member.isOnline ? 'success' : 'secondary'} className="text-[10px]">
                  {member.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                  <p className="text-[15px] font-[600] text-[var(--text)]">{member.metrics.projects.length}</p>
                  <p className="text-[10px] text-[var(--text-3)]">Projetos</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                  <p className="text-[15px] font-[600] text-[var(--text)]">{member.metrics.openTickets}</p>
                  <p className="text-[10px] text-[var(--text-3)]">Tickets</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                  <p className="text-[15px] font-[600] text-[var(--text)]">{member.metrics.weeklyHours}h</p>
                  <p className="text-[10px] text-[var(--text-3)]">h/semana</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-3)]">Carga de trabalho</span>
                  <span className={`font-[500] ${getWorkloadColor(member)}`}>{getWorkloadLabel(member)}</span>
                </div>
                <Progress
                  value={member.metrics.totalTasks > 0 ? Math.min((member.metrics.overdueTasks / member.metrics.totalTasks) * 100, 100) : 0}
                  className="h-1.5"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-3)]">
                  <span>{member.metrics.totalTasks} total</span>
                  <span className="text-[var(--destructive)]">{member.metrics.overdueTasks > 0 ? `${member.metrics.overdueTasks} atrasadas` : ''}</span>
                </div>
              </div>

              {member.metrics.projects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {member.metrics.projects.slice(0, 3).map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[10px] text-[var(--text-2)] cursor-pointer hover:bg-[var(--surface-hover)]" onClick={() => router.push(`/projects/${p.id}`)}>
                      <FolderKanban className="h-3 w-3" /> {p.name.slice(0, 20)}
                    </span>
                  ))}
                  {member.metrics.projects.length > 3 && (
                    <span className="text-[10px] text-[var(--text-3)]">+{member.metrics.projects.length - 3}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-[500] flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-[var(--accent)]" /> Distribuicao de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-3)]">
                <th className="p-3 text-left font-[500]">Membro</th>
                <th className="p-3 text-center font-[500] w-20">Tarefas</th>
                <th className="p-3 text-center font-[500] w-20">Atrasadas</th>
                <th className="p-3 text-center font-[500] w-24">Horas/Sem</th>
                <th className="p-3 text-center font-[500] w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedByWorkload.map(member => {
                const overloaded = member.metrics.totalTasks > 0 && (member.metrics.overdueTasks / member.metrics.totalTasks) >= 0.5
                return (
                  <tr key={member.id} className={`border-b border-[var(--border)] ${overloaded ? 'bg-[var(--destructive-subtle)]' : 'hover:bg-[var(--surface-hover)]'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${member.isOnline ? 'bg-[var(--success)]' : 'bg-[var(--text-3)]'}`} />
                        <span className="font-[500]">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{member.metrics.totalTasks}</td>
                    <td className="p-3 text-center">
                      <span className={member.metrics.overdueTasks > 0 ? 'text-[var(--destructive)] font-[600]' : ''}>{member.metrics.overdueTasks}</span>
                    </td>
                    <td className="p-3 text-center">{member.metrics.weeklyHours}h</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                        overloaded ? 'bg-[var(--destructive)]/20 text-[var(--destructive)]' :
                        member.metrics.totalTasks === 0 ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                        'bg-[var(--surface-3)] text-[var(--text-2)]'
                      }`}>
                        {overloaded ? 'Sobrecarregado' : member.metrics.totalTasks === 0 ? 'Disponivel' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
