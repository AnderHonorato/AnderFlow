'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Smile, Meh, Frown } from 'lucide-react'

export default function NpsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/nps')
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <PageWrapper><div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-64" /></div></PageWrapper>

  const m = data?.metrics || {}
  const npsColor = m.npsScore >= 50 ? 'var(--success)' : m.npsScore >= 0 ? 'var(--warning)' : 'var(--destructive)'

  const scoreEmoji = (s: number) => s >= 9 ? '😍' : s >= 7 ? '😊' : s >= 5 ? '😐' : s >= 3 ? '😟' : '😡'

  return (
    <PageWrapper>
      <div className="p-6 space-y-6">
        <div><h1 className="text-lg font-medium">NPS - Net Promoter Score</h1><p className="text-sm text-muted-foreground mt-1">{m.total || 0} avaliações</p></div>

        <Card className="text-center" style={{ borderColor: npsColor }}>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">NPS Score</p>
            <p className="text-5xl font-bold" style={{ color: npsColor }}>{m.npsScore >= 0 ? '+' : ''}{m.npsScore || 0}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4 text-center">
            <Smile className="h-5 w-5 text-[var(--success)] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[var(--success)]">{m.promoters || 0}</p>
            <p className="text-xs text-muted-foreground">Promotores (9-10)</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Meh className="h-5 w-5 text-[var(--text-3)] mx-auto mb-1" />
            <p className="text-2xl font-bold">{m.neutrals || 0}</p>
            <p className="text-xs text-muted-foreground">Neutros (7-8)</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Frown className="h-5 w-5 text-[var(--destructive)] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[var(--destructive)]">{m.detractors || 0}</p>
            <p className="text-xs text-muted-foreground">Detratores (0-6)</p>
          </CardContent></Card>
        </div>

        {data?.monthly?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Evolução Mensal</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                    <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                    <Tooltip content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null
                      return <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg"><p className="text-xs font-medium">{label}</p><p className="text-xs">NPS: {payload[0].value}</p></div>
                    }} />
                    <Line type="monotone" dataKey="nps" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Comentários Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {(!data?.recentComments || data.recentComments.length === 0) && <p className="py-4 text-sm text-muted-foreground text-center">Nenhum comentário</p>}
              {data?.recentComments?.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 py-3">
                  <span className="text-lg shrink-0">{scoreEmoji(c.score)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium">{c.projectName}</span><Badge variant="secondary" className="text-2xs">{c.score}/10</Badge></div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.comment}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">{new Date(c.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
