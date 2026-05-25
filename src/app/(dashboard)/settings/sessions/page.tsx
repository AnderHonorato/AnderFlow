'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Monitor, Smartphone, Shield, Trash2, Loader2, Globe } from 'lucide-react'

interface SessionItem {
  id: string
  expires: string
  ipAddress: string | null
  browser: string
  os: string
  isMobile: boolean
  isCurrent: boolean
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const fetchSessions = () => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(json => { setSessions(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSessions() }, [])

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId)
    const res = await fetch(`/api/sessions?sessionId=${sessionId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Sessao revogada')
      fetchSessions()
    } else {
      const json = await res.json()
      toast.error(json.error || 'Erro ao revogar sessao')
    }
    setRevoking(null)
  }

  const handleRevokeAll = async () => {
    setRevokingAll(true)
    const res = await fetch('/api/sessions?all=true', { method: 'DELETE' })
    if (res.ok) {
      toast.success('Todas as outras sessoes foram revogadas')
      fetchSessions()
    } else {
      toast.error('Erro ao revogar sessoes')
    }
    setRevokingAll(false)
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--accent)]" /> Sessoes Ativas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus dispositivos conectados</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-[500]">{sessions.length} sess{ sessions.length === 1 ? 'ao' : 'oes' } ativa{ sessions.length === 1 ? '' : 's' }</CardTitle>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeAll} disabled={revokingAll} className="h-7 text-[11px]">
                {revokingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Revogar todas as outras
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface-hover)]">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.isCurrent ? 'bg-[var(--accent-subtle)]' : 'bg-[var(--surface-2)]'}`}>
                  {s.isMobile ? <Smartphone className="h-5 w-5 text-[var(--text-2)]" /> : <Monitor className="h-5 w-5 text-[var(--text-2)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-[500]">{s.browser} no {s.os}</p>
                    {s.isCurrent && (
                      <Badge variant="success" className="text-[10px]">Sessao atual</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.ipAddress && (
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {s.ipAddress}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--text-3)]">
                      Expira {new Date(s.expires).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(s.id)}
                    disabled={revoking === s.id}
                    className="h-7 text-[11px] text-[var(--destructive)] hover:bg-[var(--destructive-subtle)]"
                  >
                    {revoking === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Revogar
                  </Button>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center p-8 text-[var(--text-3)] text-sm">Nenhuma sessao encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
