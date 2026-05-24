'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function ProjectTimelinePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects?status=IN_PROGRESS')
      .then(r => r.json())
      .then(async json => {
        let all = json.data || []
        const done = await fetch('/api/projects?status=COMPLETED').then(r => r.json())
        all = [...all, ...(done.data || [])].filter((p: any) => p.deadline || p.createdAt)
        setProjects(all)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const today = new Date()
  const dates = projects.flatMap(p => [new Date(p.createdAt), p.deadline ? new Date(p.deadline) : new Date()])
  if (!dates.length) return null

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  maxDate.setDate(maxDate.getDate() + 30)

  const totalRange = maxDate.getTime() - minDate.getTime()
  const months: string[] = []
  const cursor = new Date(minDate)
  while (cursor <= maxDate) { months.push(cursor.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })); cursor.setMonth(cursor.getMonth() + 1) }

  const getLeft = (d: Date) => ((d.getTime() - minDate.getTime()) / totalRange) * 100
  const getWidth = (start: Date, end: Date) => Math.max(((end.getTime() - start.getTime()) / totalRange) * 100, 1)

  if (loading) return <PageWrapper><div className="p-6"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-96" /></div></PageWrapper>

  const priorityColor = (p: string) => p === 'URGENT' ? 'var(--destructive)' : p === 'HIGH' ? 'var(--warning)' : p === 'MEDIUM' ? 'var(--accent)' : 'var(--info)'

  return (
    <PageWrapper>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium">Timeline</h1><p className="text-sm text-muted-foreground mt-1">Visão Gantt dos projetos</p></div>
          <Button size="sm" variant="outline" onClick={() => document.querySelector('.timeline-scroll')?.scrollTo({ left: getLeft(today) * (document.querySelector('.timeline-scroll')?.scrollWidth || 0) / 100 - 200, behavior: 'smooth' })}>Hoje</Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto timeline-scroll">
            <div style={{ minWidth: months.length * 120 + 200 }}>
              <div className="flex border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10">
                <div className="w-[200px] shrink-0 p-3 border-r border-[var(--border)]"><span className="text-xs font-medium text-[var(--text-3)]">Projeto</span></div>
                {months.map((m, i) => <div key={i} className="flex-1 text-center p-3 border-r border-[var(--border)] text-[10px] text-[var(--text-3)]">{m}</div>)}
              </div>

              {projects.map(p => {
                const start = new Date(p.createdAt)
                const end = p.deadline ? new Date(p.deadline) : new Date()
                return (
                  <div key={p.id} className="flex border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                    <div className="w-[200px] shrink-0 p-3 border-r border-[var(--border)]">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-[var(--text-3)] truncate">{p.client?.name || p.client?.company || ''}</p>
                    </div>
                    <div className="flex-1 relative p-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute h-6 rounded-full cursor-pointer" style={{ left: `${getLeft(start)}%`, width: `${getWidth(start, end)}%`, background: priorityColor(p.priority || 'MEDIUM'), top: '50%', transform: 'translateY(-50%)' }}>
                            <div className="h-full rounded-full opacity-40" style={{ background: 'rgba(255,255,255,0.3)', width: `${p.progress || 0}%` }} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs font-medium">{p.name}</p>
                          <p className="text-2xs text-muted-foreground">{p.client?.name} · {p.progress || 0}% · {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
