'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  IconPlus, IconSearch, IconLayoutGrid, IconList,
  IconMoreHorizontal, IconCalendar, IconArrowUpRight,
} from '@/components/icons'

type ViewMode = 'kanban' | 'list'

const columns = [
  { id: 'PENDING', title: 'Solicitacoes', color: 'var(--warning)' },
  { id: 'DRAFT', title: 'Rascunho', color: 'var(--text-3)' },
  { id: 'TODO', title: 'A Fazer', color: 'var(--accent)' },
  { id: 'IN_PROGRESS', title: 'Em Progresso', color: 'var(--info)' },
  { id: 'REVIEW', title: 'Revisao', color: 'var(--warning)' },
  { id: 'COMPLETED', title: 'Concluido', color: 'var(--success)' },
]

function ProjectCard({ project, onView, onArchive, index = 0 }: {
  project: any; onView: (id: string) => void; onArchive: (id: string) => void; index?: number
}) {
  const isNew = project.status === 'PENDING' &&
    (Date.now() - new Date(project.createdAt).getTime()) < 48 * 60 * 60 * 1000

  return (
    <Card
      className={`card-hover cursor-pointer animate-card-pop ripple-container stagger-${Math.min(index + 1, 6)}`}
      onClick={() => onView(project.id)}
    >
      <CardContent className="p-3 space-y-2.5">
        {isNew && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] pulse-success" />
            <span className="text-[9px] font-[600] text-[var(--warning)] uppercase tracking-wider">
              Nova solicitacao
            </span>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {project.number && <span className="text-[10px] font-[500] text-[var(--text-3)] shrink-0">{project.number}</span>}
              <p className="text-[13px] font-[500] truncate">{project.name}</p>
            </div>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5">{project.client?.company || project.client?.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <IconMoreHorizontal className="w-[14px] h-[14px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project.id) }}>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem className="text-[var(--destructive)]" onClick={(e) => { e.stopPropagation(); onArchive(project.id) }}>Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">{project._count?.tasks || 0} tarefas</span>
            <span className="font-[500]">{project.progress || 0}%</span>
          </div>
          <div className="h-[2px] rounded-full bg-[var(--surface-hover)] overflow-hidden progress-bar-animated">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: `${project.progress || 0}%`,
                background: (project.progress || 0) >= 80 ? 'var(--success)' :
                            (project.progress || 0) >= 40 ? 'var(--accent)' : 'var(--info)'
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Badge variant={project.priority === 'URGENT' ? 'destructive' : project.priority === 'HIGH' ? 'warning' : 'secondary'}>
            {project.priority === 'URGENT' ? 'Urgente' : project.priority === 'HIGH' ? 'Alta' : project.priority === 'MEDIUM' ? 'Media' : 'Baixa'}
          </Badge>
          {project.deadline && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
              <IconCalendar className="w-[12px] h-[12px]" />
              {new Date(project.deadline).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadProjects = () => {
    setRefreshing(true)
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => {
        setProjects(json.data || [])
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => {
    loadProjects()
    const interval = setInterval(loadProjects, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewProject = (id: string) => {
    window.location.href = `/projects/${id}`
  }

  const handleArchiveProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true }) })
    toast.success('Projeto arquivado')
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-9 w-32" /></div>
        <div className="flex gap-3"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-20" /></div>
        <div className="flex gap-4 overflow-x-auto">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96 w-[260px]" />)}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <OnboardingTip
        id="projects_tip"
        title="Gestao de Projetos"
        description="Arraste cards entre as colunas do Kanban. Clique em 'Novo Projeto' para criar um briefing completo. Use a busca para filtrar."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Projetos</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{projects.length} projetos encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={loadProjects} disabled={refreshing}
            className={refreshing ? 'opacity-50' : ''}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round"
              className={refreshing ? 'spin' : ''}>
              <path d="M2 8a6 6 0 016-6 6 6 0 014.8 2.4L14 6M14 8a6 6 0 01-6 6 6 6 0 01-4.8-2.4L2 10"/>
            </svg>
          </Button>
          <Button size="sm" asChild>
            <a href="/portal/briefing">
              <IconPlus className="w-[14px] h-[14px]" />
              Novo Projeto
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--text-3)]" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center border border-[var(--border-2)] rounded-lg">
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('kanban')}>
            <IconLayoutGrid className="w-[14px] h-[14px]" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('list')}>
            <IconList className="w-[14px] h-[14px]" />
          </Button>
        </div>
      </div>

      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((column) => {
            const colProjects = filtered.filter((p) => p.status === column.id)
            const isPending = column.id === 'PENDING'

            if (colProjects.length === 0 && !isPending) return null

            return (
              <div key={column.id} className="flex-shrink-0 w-[260px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: column.color }} />
                  <span className="text-[13px] font-[500] text-[var(--text)]">{column.title}</span>
                  <span className="text-[11px] text-[var(--text-3)]">{colProjects.length}</span>
                  {isPending && colProjects.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-[600] bg-[var(--warning-subtle)] text-[var(--warning)] badge-new uppercase">
                      NOVO
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {colProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index}
                      onView={handleViewProject} onArchive={handleArchiveProject} />
                  ))}
                  {isPending && colProjects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border-2)] p-4 text-center">
                      <p className="text-[11px] text-[var(--text-3)]">Aguardando solicitacoes</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((project) => (
                <div key={project.id} className="flex items-center gap-4 p-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer" onClick={() => handleViewProject(project.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {project.number && <span className="text-[10px] font-[500] text-[var(--text-3)]">{project.number}</span>}
                      <p className="text-[13px] font-[500]">{project.name}</p>
                      <Badge variant={project.priority === 'URGENT' ? 'destructive' : project.priority === 'HIGH' ? 'warning' : 'secondary'}>
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">{project.client?.company || project.client?.name}</p>
                  </div>
                  <div className="w-24"><Progress value={project.progress || 0} className="h-[2px]" /></div>
                  <span className="text-[12px] font-[500] w-8">{project.progress || 0}%</span>
                  {project.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                      <IconCalendar className="w-[12px] h-[12px]" />
                      {new Date(project.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <Button variant="ghost" size="icon-sm">
                    <IconArrowUpRight className="w-[14px] h-[14px]" />
                  </Button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhum projeto encontrado</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
