'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { GripVertical, Plus } from 'lucide-react'
import {
  IconPlus, IconSearch, IconLayoutGrid, IconList,
  IconMoreHorizontal, IconCalendar,
} from '@/components/icons'
import { Download } from 'lucide-react'

type ViewMode = 'kanban' | 'list'

const STATUS_COLUMNS = [
  { id: 'PENDING', title: 'Solicitacoes', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  { id: 'DRAFT', title: 'Rascunho', color: 'var(--info)', bg: 'var(--info-subtle)' },
  { id: 'IN_PROGRESS', title: 'Em Progresso', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  { id: 'REVIEW', title: 'Revisao', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  { id: 'COMPLETED', title: 'Concluido', color: 'var(--success)', bg: 'var(--success-subtle)' },
]

const PRIORITY_FILTERS = [
  { id: 'URGENT', label: 'Urgente', variant: 'destructive' as const },
  { id: 'HIGH', label: 'Alta', variant: 'warning' as const },
  { id: 'MEDIUM', label: 'Media', variant: 'secondary' as const },
  { id: 'LOW', label: 'Baixa', variant: 'outline' as const },
]

function SortableProjectCard({ project, onView, onArchive, index }: {
  project: any; onView: (id: string) => void; onArchive: (id: string) => void; index: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const isNew = project.status === 'PENDING' &&
    (Date.now() - new Date(project.createdAt).getTime()) < 48 * 60 * 60 * 1000

  const clientInitials = (project.client?.name || '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="card-hover cursor-pointer animate-card-pop ripple-container"
      onClick={() => onView(project.id)}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-2" {...attributes} {...listeners}>
          <GripVertical className="h-3.5 w-3.5 text-[var(--text-3)] opacity-0 group-hover/card:opacity-50 cursor-grab shrink-0" />
          {isNew && (
            <div className="flex items-center gap-1.5 m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] pulse-success" />
              <span className="text-[9px] font-[600] text-[var(--warning)] uppercase tracking-wider">
                Novo
              </span>
            </div>
          )}
          {!isNew && <div />}
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge variant={project.priority === 'URGENT' ? 'destructive' : project.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-2xs h-4 px-1">
                {project.priority === 'URGENT' ? 'URG' : project.priority === 'HIGH' ? 'ALT' : project.priority === 'LOW' ? 'BAX' : 'MED'}
              </Badge>
              {project.number && <span className="text-[10px] font-[500] text-[var(--text-3)] shrink-0">{project.number}</span>}
            </div>
            <p className="text-[13px] font-[500] truncate mt-1">{project.name}</p>
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

        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={project.client?.image || undefined} />
            <AvatarFallback className="text-[8px]">{clientInitials}</AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-[var(--text-3)] truncate">{project.client?.company || project.client?.name}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">
              {project._count?.tasks || 0} tarefas
            </span>
            <span className="font-[500]">{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-[2px]" />
        </div>

        {project.deadline && (
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
            <IconCalendar className="w-[12px] h-[12px]" />
            {new Date(project.deadline).toLocaleDateString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ column, projects, onView, onArchive }: {
  column: typeof STATUS_COLUMNS[0]; projects: any[]; onView: (id: string) => void; onArchive: (id: string) => void
}) {
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div
        className="flex items-center justify-between mb-3 px-1 py-1.5 rounded-lg"
        style={{ background: column.bg }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: column.color }} />
          <span className="text-[12px] font-[600] text-[var(--text)]">{column.title}</span>
          <span className="text-[11px] font-[600] text-[var(--text-3)] bg-[var(--surface)] px-1.5 py-px rounded-full">
            {projects.length}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-60 hover:opacity-100" asChild>
          <a href="/portal/briefing">
            <Plus className="h-3 w-3" />
          </a>
        </Button>
      </div>
      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {projects.length === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
              <p className="text-[11px] text-[var(--text-3)]">Arraste projetos para ca</p>
            </div>
          )}
          {projects.map((project, index) => (
            <SortableProjectCard key={project.id} project={project} index={index}
              onView={onView} onArchive={onArchive} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProjectsPage() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadProjects = useCallback(() => {
    setRefreshing(true)
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => {
        setProjects(json.data || [])
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => {
    loadProjects()
    fetch('/api/clients')
      .then(r => r.json())
      .then(json => setClients(json.data || []))
      .catch(() => {})
    const interval = setInterval(loadProjects, 30000)
    return () => clearInterval(interval)
  }, [loadProjects])

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (clientFilter && p.clientId !== clientFilter) return false
    if (priorityFilter && p.priority !== priorityFilter) return false
    return true
  })

  const handleViewProject = (id: string) => {
    window.location.href = `/projects/${id}`
  }

  const handleArchiveProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true }) })
    toast.success('Projeto arquivado')
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const projectId = active.id as string
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const overId = over.id as string

    const targetProject = projects.find(p => p.id === overId)
    let newStatus: string | null = null

    if (targetProject) {
      const targetCol = STATUS_COLUMNS.find(c => c.id === targetProject.status)
      if (targetCol) newStatus = targetCol.id
    } else {
      const targetCol = STATUS_COLUMNS.find(c => c.id === overId)
      if (targetCol) newStatus = targetCol.id
    }

    if (!newStatus || newStatus === project.status) return

    setProjects(prev => {
      const updated = prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
      return updated
    })

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Movido para ${STATUS_COLUMNS.find(c => c.id === newStatus)?.title || newStatus}`)
    } catch {
      toast.error('Erro ao mover projeto')
      loadProjects()
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-9 w-32" /></div>
        <div className="flex gap-3"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-20" /></div>
        <div className="flex gap-4 overflow-x-auto">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-96 w-[280px]" />)}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <OnboardingTip
        id="projects_tip"
        title="Gestao de Projetos"
        description="Arraste cards entre as colunas do Kanban. Use os filtros para encontrar projetos rapidamente."
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
              <path d="M2 8a6 6 0 016-6 6 6 0 014.8 2.4L14 6M14 8a6 6 0 01-6 6 6 6 0 01-4.8-2.4L2 10" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => window.open('/api/projects/export', '_blank')}>
            <Download className="w-[12px] h-[12px]" /> Exportar CSV
          </Button>
          <Button size="sm" asChild>
            <a href="/portal/briefing">
              <IconPlus className="w-[14px] h-[14px]" />
              Novo Projeto
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--text-3)]" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <select
          className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-3 text-[12px] text-[var(--text)]"
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
        >
          <option value="">Todos clientes</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {PRIORITY_FILTERS.map(pf => (
            <button
              key={pf.id}
              onClick={() => setPriorityFilter(prev => prev === pf.id ? null : pf.id)}
              className={`text-[10px] font-[500] px-2 py-1 rounded-md border transition-colors ${
                priorityFilter === pf.id
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--text-3)]'
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center border border-[var(--border)] rounded-lg">
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('kanban')}>
            <IconLayoutGrid className="w-[14px] h-[14px]" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('list')}>
            <IconList className="w-[14px] h-[14px]" />
          </Button>
        </div>
      </div>

      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((column) => {
              const colProjects = filtered.filter((p) => p.status === column.id)
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  projects={colProjects}
                  onView={handleViewProject}
                  onArchive={handleArchiveProject}
                />
              )
            })}
          </div>
        </DndContext>
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
                  <Button variant="ghost" size="icon-sm" onClick={() => handleViewProject(project.id)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3l5 5-5 5M14 8H3"/></svg>
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
