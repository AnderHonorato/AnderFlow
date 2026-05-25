'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, ThumbsUp, Clock, DollarSign } from 'lucide-react'

export default function AiPerformancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/ai')
      .then(r => r.json())
      .then(json => setData(json.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div>

  const d = data || {}
  const satisfactionRate = d.satisfactionRate || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-medium">Performance da IA</h1>
        <p className="text-sm text-muted-foreground mt-1">Dashboard de uso e performance da inteligencia artificial</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-2xs">Total</Badge>
            </div>
            <p className="text-2xl font-semibold">{d.totalConversations || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Interacoes IA</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="h-4 w-4 text-success" />
              <Badge variant="success" className="text-2xs">{satisfactionRate}%</Badge>
            </div>
            <p className="text-2xl font-semibold">{d.positiveFeedback || 0}/{d.totalFeedback || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Feedbacks positivos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{d.avgMessagesPerConversation || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Msgs por conversa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-semibold">${d.estimatedCost?.toFixed(4) || '0.0000'}</p>
            <p className="text-xs text-muted-foreground mt-1">Custo estimado (30d)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily usage chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Uso diario (30 dias)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {(d.dailyUsage || []).map((day: any, i: number) => {
                const max = Math.max(1, ...(d.dailyUsage || []).map((x: any) => x.count))
                const height = (day.count / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group" title={`${day.day}: ${day.count}`}>
                    <span className="text-2xs text-muted-foreground mb-0.5 opacity-0 group-hover:opacity-100">{day.count}</span>
                    <div className="w-full bg-[var(--accent)] rounded-t opacity-70 hover:opacity-100 transition-opacity" style={{ height: `${height}%`, minHeight: day.count > 0 ? 2 : 0 }} />
                  </div>
                )
              })}
              {(d.dailyUsage || []).length === 0 && <p className="text-xs text-muted-foreground w-full text-center py-8">Sem dados</p>}
            </div>
          </CardContent>
        </Card>

        {/* Type distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuicao por tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(d.typeDistribution || []).map((item: any) => {
                const max = Math.max(1, ...(d.typeDistribution || []).map((x: any) => x.count))
                const pct = (item.count / max) * 100
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top prompts */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Palavras mais usadas nos prompts</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(d.topKeywords || []).map((kw: any) => (
              <Badge key={kw.word} variant="secondary" className="text-xs px-2.5 py-1">
                {kw.word} <span className="ml-1 text-[var(--text-3)]">{kw.count}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
