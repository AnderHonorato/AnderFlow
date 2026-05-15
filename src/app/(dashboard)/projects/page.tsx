'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

type ViewMode = 'kanban' | 'list'

const columns = [
  { id: 'DRAFT', title: 'Rascunho', color: 'bg-muted-foreground' },
  { id: 'TODO', title: 'A Fazer', color: 'bg-info' },
  { id: 'IN_PROGRESS', title: 'Em Progresso', color: 'bg-warning' },
  { id: 'REVIEW', title: 'Revisão', color: 'bg-purple-500' },
  { id: 'COMPLETED', title: 'Concluído', color: 'bg-success' },
]

function ProjectCard({ project, onView, onArchive }: { project: any; onView: (id: string) => void; onArchive: (id: string) => void }) {
  return (
    <Card className="card-hover cursor-pointer" onClick={() => onView(project.id)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{project.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{project.client?.company || project.client?.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project.id) }}>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onArchive(project.id) }}>Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{project._count?.tasks || 0} tarefas</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant={project.priority === 'URGENT' ? 'destructive' : project.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-2xs">
            {project.priority === 'URGENT' ? 'Urgente' : project.priority === 'HIGH' ? 'Alta' : project.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
          </Badge>
          {project.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
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

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => {
        setProjects(json.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
        <div className="flex gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96 w-[300px]" />)}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="projects_tip"
        title="Gestão de Projetos"
        description="Arraste cards entre as colunas do Kanban. Clique em 'Novo Projeto' para criar um briefing completo. Use a busca para filtrar."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projetos encontrados</p>
        </div>
        <Button size="sm" asChild>
          <a href="/portal/briefing">
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center border rounded-md">
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('kanban')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const colProjects = filtered.filter((p) => p.status === column.id)
            if (colProjects.length === 0) return null
            return (
              <div key={column.id} className="flex-shrink-0 w-[300px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${column.color}`} />
                  <span className="text-sm font-medium">{column.title}</span>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">{colProjects.length}</Badge>
                </div>
                <div className="space-y-3">
                  {colProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} onView={handleViewProject} onArchive={handleArchiveProject} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((project) => (
                <div key={project.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{project.name}</p>
                      <Badge variant={project.priority === 'URGENT' ? 'destructive' : project.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-2xs">
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.client?.company || project.client?.name}</p>
                  </div>
                  <div className="w-24"><Progress value={project.progress} className="h-1.5" /></div>
                  <span className="text-xs font-medium w-8">{project.progress}%</span>
                  {project.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <Button variant="ghost" size="icon-sm"><ArrowUpRight className="h-4 w-4" /></Button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-muted-foreground text-sm">Nenhum projeto encontrado</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
