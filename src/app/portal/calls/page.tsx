'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, Clock, Video } from 'lucide-react'

export default function PortalCallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('future')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/calls?filter=${filter}`)
      .then(r => r.json())
      .then(json => setCalls(json.data || []))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Minhas Reunioes</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe as reunioes agendadas com nossa equipe</p>
      </div>

      <div className="flex gap-2">
        {(['future', 'past', 'all'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'future' ? 'Futuras' : f === 'past' ? 'Passadas' : 'Todas'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : calls.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma reuniao agendada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {calls.map(call => {
            const isToday = new Date(call.scheduledAt).toDateString() === new Date().toDateString()
            return (
              <Card key={call.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                    <Video className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{call.title}</p>
                      {isToday && <Badge variant="success" className="text-2xs">Hoje</Badge>}
                      <Badge variant="secondary" className="text-2xs">
                        {call.status === 'scheduled' ? 'Agendada' : call.status === 'completed' ? 'Realizada' : 'Cancelada'}
                      </Badge>
                    </div>
                    {call.description && <p className="text-xs text-muted-foreground mt-0.5">{call.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(call.scheduledAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-2xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(call.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-2xs text-muted-foreground">{call.duration}min</span>
                    </div>
                  </div>
                  {call.meetLink && call.status !== 'cancelled' && (
                    <Button variant="outline" size="sm" onClick={() => window.open(call.meetLink, '_blank')}>
                      <Video className="mr-2 h-3.5 w-3.5" /> Entrar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
