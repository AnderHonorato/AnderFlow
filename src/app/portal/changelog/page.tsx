'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles, Bug, Zap, MessageSquare,
} from 'lucide-react'

const TYPE_ICONS: Record<string, any> = { feature: Sparkles, fix: Bug, improvement: Zap }
const TYPE_COLORS: Record<string, string> = { feature: 'var(--accent)', fix: 'var(--destructive)', improvement: 'var(--info)' }

export default function PortalChangelogPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(json => setEntries(json.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Novidades</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe as novidades e melhorias da ANDERFLOW</p>
      </div>

      {entries.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma novidade publicada ainda.</CardContent></Card>
      )}

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border)]" />
        <div className="space-y-6">
          {entries.map((entry, i) => {
            const IconComp = TYPE_ICONS[entry.type] || MessageSquare
            return (
              <div key={entry.id} className="relative pl-10">
                <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-[var(--bg)]" style={{ background: TYPE_COLORS[entry.type] || 'var(--text-3)' }} />
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-2xs gap-1">
                        <IconComp className="h-3 w-3" />
                        {entry.type === 'feature' ? 'Feature' : entry.type === 'fix' ? 'Correcao' : 'Melhoria'}
                      </Badge>
                      <span className="text-2xs text-muted-foreground">v{entry.version}</span>
                      {entry.publishedAt && (
                        <span className="text-2xs text-muted-foreground">{new Date(entry.publishedAt).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold">{entry.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.description}</p>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
