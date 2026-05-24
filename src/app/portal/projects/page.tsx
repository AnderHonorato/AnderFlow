'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/icons'
import { AdminPresence } from '@/components/ui/admin-presence'

export default function PortalProjects() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { setProjects(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[17px] font-[500] tracking-[-0.015em]">Meus Projetos</h2>
        <p className="text-[12px] text-[var(--text-3)] mt-1">{projects.length} projetos encontrados</p>
      </div>
      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="text-[13px] text-[var(--text-3)] text-center py-12">Nenhum projeto encontrado</p>
        )}
        {projects.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {p.number && <span className="text-[10px] font-[500] text-[var(--text-3)]">{p.number}</span>}
                  <p className="text-[13px] font-[500]">{p.name}</p>
                  <Badge status={p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'REVIEW' ? 'REVIEW' : p.status === 'PENDING' ? 'PENDING' : p.status === 'DRAFT' ? 'DRAFT' : p.status === 'TODO' ? 'TODO' : 'IN_PROGRESS'}>
                    {p.status === 'COMPLETED' ? 'Concluido' : p.status === 'REVIEW' ? 'Revisao' : p.status === 'PENDING' ? 'Solicitacao' : p.status === 'DRAFT' ? 'Rascunho' : p.status === 'TODO' ? 'A fazer' : 'Em andamento'}
                  </Badge>
                  {p.status === 'TODO' && (
                    <Button size="sm" className="h-6 text-[10px]" onClick={() => router.push(`/projects/${p.id}`)}>
                      Ver projeto <IconArrowRight className="w-[10px] h-[10px]" />
                    </Button>
                  )}
                </div>
                <p className="text-[12px] text-[var(--text-3)] mt-1">{p.description}</p>
                {p.status === 'IN_PROGRESS' && <AdminPresence projectId={p.id} />}
                {p.status === 'PENDING' ? (
                  <p className="text-[11px] text-[var(--warning)] mt-1">
                    Sua solicitacao esta em analise. Aguarde ate 24 horas que retornamos com uma resposta.
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--text-3)] mt-1">
                    Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Progress value={p.progress || 0} className="w-32 h-[2px]" />
                <span className="text-[13px] font-[500]">{p.progress || 0}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
