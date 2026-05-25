'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ZoomIn, ZoomOut, RotateCcw, ArrowLeft } from 'lucide-react'

interface TaskNode {
  id: string
  title: string
  status: string
  level: number
  index: number
  assignee?: { name: string } | null
}

const COLORS: Record<string, string> = {
  TODO: 'var(--surface-3)',
  IN_PROGRESS: 'var(--accent)',
  DONE: 'var(--success)',
  CANCELLED: 'var(--destructive)',
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluido',
  CANCELLED: 'Cancelado',
}

export default function DependenciesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [tasks, setTasks] = useState<TaskNode[]>([])
  const [dependencies, setDependencies] = useState<{ taskId: string; dependsOnId: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState<TaskNode | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [projRes, depsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch('/api/task-dependencies'),
      ])
      const proj = await projRes.json()
      const deps = await depsRes.json()

      const rawTasks: any[] = proj.data?.tasks || []
      const depsList = (deps.data || []).filter((d: any) =>
        rawTasks.some((t: any) => t.id === d.taskId)
      )

      // Sugiyama simplified - level by dependency
      const taskMap = new Map<string, any>()
      rawTasks.forEach((t: any) => taskMap.set(t.id, t))

      const depMap = new Map<string, string[]>()
      depsList.forEach((d: any) => {
        if (!depMap.has(d.taskId)) depMap.set(d.taskId, [])
        depMap.get(d.taskId)!.push(d.dependsOnId)
      })

      function getLevel(taskId: string, visited = new Set<string>()): number {
        if (visited.has(taskId)) return 0
        visited.add(taskId)
        const parents = depMap.get(taskId) || []
        if (parents.length === 0) return 0
        return 1 + Math.max(...parents.map(p => getLevel(p, visited)))
      }

      const indexed: TaskNode[] = []
      const levelCounts = new Map<number, number>()
      rawTasks.forEach((t: any) => {
        const level = getLevel(t.id)
        const count = levelCounts.get(level) || 0
        levelCounts.set(level, count + 1)
        indexed.push({
          id: t.id,
          title: t.title,
          status: t.status,
          level,
          index: count,
          assignee: t.assignee,
        })
      })

      setTasks(indexed)
      setDependencies(depsList)
      setLoading(false)
    }
    fetchData()
  }, [projectId])

  const BOX_W = 140
  const BOX_H = 50
  const GAP_X = 200
  const GAP_Y = 70

  const longestPathTaskIds = (() => {
    const inDeg = new Map<string, number>()
    const adj = new Map<string, string[]>()
    tasks.forEach(t => { inDeg.set(t.id, 0); adj.set(t.id, []) })
    dependencies.forEach(d => {
      adj.get(d.dependsOnId)?.push(d.taskId)
      inDeg.set(d.taskId, (inDeg.get(d.taskId) || 0) + 1)
      inDeg.set(d.dependsOnId, inDeg.get(d.dependsOnId) || 0)
    })

    const dist = new Map<string, number>()
    const queue = [...tasks.filter(t => inDeg.get(t.id) === 0).map(t => t.id)]
    queue.forEach(id => dist.set(id, 1))

    while (queue.length) {
      const u = queue.shift()!
      for (const v of adj.get(u) || []) {
        const newDist = (dist.get(u) || 0) + 1
        if (newDist > (dist.get(v) || 0)) dist.set(v, newDist)
        inDeg.set(v, (inDeg.get(v) || 1) - 1)
        if (inDeg.get(v) === 0) queue.push(v)
      }
    }

    const maxDist = Math.max(...Array.from(dist.values()), 0)
    return new Set(Array.from(dist.entries()).filter(([, d]) => d === maxDist).map(([id]) => id))
  })()

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[500px] w-full" /></div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text)] mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
          <h1 className="text-lg font-medium">Dependencias de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualizacao em grafo das dependencias do projeto</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" onClick={() => setScale(s => Math.max(0.3, s - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setScale(s => Math.min(2, s + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}><RotateCcw className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {Object.entries(COLORS).map(([status, color]) => (
          <Badge key={status} variant="secondary" className="text-2xs gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
            {STATUS_LABELS[status] || status}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden" style={{ height: '600px' }}>
          <div
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={e => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }) }}
            onMouseMove={e => { if (dragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }) }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--text-3)" />
                </marker>
              </defs>

              {tasks.map(task => {
                const deps = dependencies.filter(d => d.taskId === task.id)
                return deps.map(d => {
                  const parent = tasks.find(t => t.id === d.dependsOnId)
                  if (!parent) return null
                  const x1 = (task.level * GAP_X) + BOX_W / 2
                  const y1 = (task.index * GAP_Y) + BOX_H
                  const x2 = (parent.level * GAP_X) + BOX_W / 2
                  const y2 = (parent.index * GAP_Y) + BOX_H / 2
                  return (
                    <line
                      key={`${d.taskId}-${d.dependsOnId}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--border)"
                      strokeWidth={1.5}
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })
              })}

              {tasks.map(task => {
                const x = task.level * GAP_X
                const y = task.index * GAP_Y
                const isCritical = longestPathTaskIds.has(task.id)
                return (
                  <g key={task.id} onClick={() => setTooltip(task)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={x}
                      y={y}
                      width={BOX_W}
                      height={BOX_H}
                      rx={8}
                      fill={COLORS[task.status] || 'var(--surface-3)'}
                      stroke={isCritical ? 'var(--destructive)' : 'var(--border)'}
                      strokeWidth={isCritical ? 2 : 1}
                      className="hover:brightness-110 transition-all"
                    />
                    <text
                      x={x + BOX_W / 2}
                      y={y + BOX_H / 2 - 4}
                      textAnchor="middle"
                      fill={task.status === 'TODO' ? 'var(--text)' : '#fff'}
                      fontSize="11"
                      fontWeight={500}
                    >
                      {task.title.length > 18 ? task.title.slice(0, 18) + '...' : task.title}
                    </text>
                    <text
                      x={x + BOX_W / 2}
                      y={y + BOX_H / 2 + 12}
                      textAnchor="middle"
                      fill={task.status === 'TODO' ? 'var(--text-3)' : 'rgba(255,255,255,0.7)'}
                      fontSize="9"
                    >
                      {STATUS_LABELS[task.status] || task.status}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {tooltip && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
          <Card className="w-64">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{tooltip.title}</span>
                <button onClick={() => setTooltip(null)} className="text-[var(--text-3)] hover:text-[var(--text)] text-xs">X</button>
              </div>
              <Badge variant="secondary" className="text-2xs">{STATUS_LABELS[tooltip.status]}</Badge>
              {tooltip.assignee && <p className="text-xs text-muted-foreground">Responsavel: {tooltip.assignee.name}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
