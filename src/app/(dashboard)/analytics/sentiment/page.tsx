'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Smile, Meh, Frown, AlertTriangle } from 'lucide-react'

export default function SentimentAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const positiveWords = useMemo(() => ['bom', 'otimo', 'excelente', 'obrigado', 'gostei', 'perfeito', 'rapido', 'feliz', 'satisfeito', 'incrivel'], [])
  const negativeWords = useMemo(() => ['ruim', 'pessimo', 'erro', 'atraso', 'problema', 'insatisfeito', 'lento', 'falha', 'bug', 'demora'], [])
  const stopWords = useMemo(() => ['que', 'com', 'para', 'nao', 'uma', 'dos', 'das', 'mais', 'como', 'por'], [])

  useEffect(() => {
    const fetchData = async () => {
      const [commentsRes, updatesRes] = await Promise.all([
        fetch('/api/inbox?all=true').then(r => r.json()),
        fetch('/api/project-updates').then(r => r.json()),
      ])

      const comments = (commentsRes.data || []).filter((c: any) => c.content)
      const updates = (updatesRes.data || []).filter((u: any) => u.description)

      const allTexts = [
        ...comments.map((c: any) => ({ text: c.content, date: c.createdAt, projectId: c.projectId })),
        ...updates.map((u: any) => ({ text: u.description, date: u.createdAt, projectId: u.projectId })),
      ]

      const sentiments: Record<string, number> = { positive: 0, neutral: 0, negative: 0 }
      const monthly: Record<string, Record<string, number>> = {}

      for (const item of allTexts) {
        const month = new Date(item.date).toISOString().slice(0, 7)
        if (!monthly[month]) monthly[month] = { positive: 0, neutral: 0, negative: 0 }

        const text = item.text.toLowerCase()
        const posCount = positiveWords.filter(w => text.includes(w)).length
        const negCount = negativeWords.filter(w => text.includes(w)).length

        if (posCount > negCount) { sentiments.positive++; monthly[month].positive++ }
        else if (negCount > posCount) { sentiments.negative++; monthly[month].negative++ }
        else { sentiments.neutral++; monthly[month].neutral++ }
      }

      const negWords = new Map<string, number>()
      for (const item of allTexts) {
        const text = item.text.toLowerCase()
        const words = text.split(/\s+/)
        const posCount = positiveWords.filter(w => text.includes(w)).length
        const negCount = negativeWords.filter(w => text.includes(w)).length
        if (negCount > posCount) {
          for (const word of words) {
            const clean = word.replace(/[^a-z]/g, '')
            if (clean.length > 3 && !stopWords.includes(clean)) {
              negWords.set(clean, (negWords.get(clean) || 0) + 1)
            }
          }
        }
      }

      const topNegativeKeywords = Array.from(negWords.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 15)

      const total = sentiments.positive + sentiments.neutral + sentiments.negative || 1
      setData({ sentiments, monthly, topNegativeKeywords, total })
      setLoading(false)
    }
    fetchData()
  }, [positiveWords, negativeWords, stopWords])

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const { sentiments, topNegativeKeywords, total } = data || { sentiments: { positive: 0, neutral: 0, negative: 0 }, topNegativeKeywords: [], total: 1 }

  const pieData = [
    { label: 'Positivo', value: sentiments.positive, color: 'var(--success)', icon: Smile },
    { label: 'Neutro', value: sentiments.neutral, color: 'var(--info)', icon: Meh },
    { label: 'Negativo', value: sentiments.negative, color: 'var(--destructive)', icon: Frown },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-medium">Analise de Sentimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Sentimento dos comentarios e check-ins</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Donut Chart */}
        <Card>
          <CardHeader><CardTitle>Distribuicao de Sentimentos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--surface-2)" strokeWidth="20" />
                {(() => {
                  const totalAngle = 360
                  let startAngle = -90
                  return pieData.filter(d => d.value > 0).map(d => {
                    const angle = (d.value / total) * totalAngle
                    const endAngle = startAngle + angle
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const x1 = 80 + 70 * Math.cos(startRad)
                    const y1 = 80 + 70 * Math.sin(startRad)
                    const x2 = 80 + 70 * Math.cos(endRad)
                    const y2 = 80 + 70 * Math.sin(endRad)
                    const largeArc = angle > 180 ? 1 : 0
                    const el = (
                      <path
                        key={d.label}
                        d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={d.color}
                      />
                    )
                    startAngle = endAngle
                    return el
                  })
                })()}
                <circle cx="80" cy="80" r="45" fill="var(--bg)" />
                <text x="80" y="76" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="600">{total}</text>
                <text x="80" y="92" textAnchor="middle" fill="var(--text-3)" fontSize="10">total</text>
              </svg>
              <div className="space-y-3">
                {pieData.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.label}</span>
                    <span className="text-sm font-semibold">{d.value}</span>
                    <span className="text-xs text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Word Cloud */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">
            <Frown className="h-4 w-4 text-destructive" />
            Palavras mais frequentes (negativos)
          </CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center items-center min-h-[200px]">
              {topNegativeKeywords.slice(0, 20).map(([word, count]: [string, number]) => {
                const maxCount = topNegativeKeywords[0]?.[1] || 1
                const fontSize = 10 + (count / maxCount) * 22
                const opacity = 0.5 + (count / maxCount) * 0.5
                return (
                  <span
                    key={word}
                    className="inline-block px-2 py-1 rounded-full text-[var(--destructive)]"
                    style={{ fontSize: `${fontSize}px`, opacity, fontWeight: count > maxCount * 0.5 ? 600 : 400 }}
                  >
                    {word}
                  </span>
                )
              })}
              {topNegativeKeywords.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma palavra negativa encontrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas
        </CardTitle></CardHeader>
        <CardContent>
          {(
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{sentiments.negative > 3
                ? `${sentiments.negative} comentarios negativos detectados. Verifique os projetos para mais detalhes.`
                : 'Nenhum alerta critico de sentimento no momento.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
