'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

export default function PortalProjects() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => {
        const all = json.data || []
        setProjects(all.filter((p: any) => p.client?.email === session?.user?.email))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session])

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium">Meus Projetos</h2>
        <p className="text-sm text-muted-foreground mt-1">{projects.length} projetos encontrados</p>
      </div>
      <div className="space-y-3">
        {projects.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : 'info'} className="text-2xs">
                    {p.status === 'COMPLETED' ? 'Concluído' : p.status === 'REVIEW' ? 'Revisão' : 'Em andamento'}
                  </Badge>
                  <Badge variant="secondary" className="text-2xs">{p.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={p.progress} className="w-32 h-2" />
                <span className="text-sm font-medium">{p.progress}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
