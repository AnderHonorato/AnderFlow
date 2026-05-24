'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, Sparkles, Radar } from 'lucide-react'

interface SatisfactionData {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  breakdown: {
    nps: { score: number; weight: number; responses: number }
    checkins: { score: number; weight: number; count: number }
    sla: { score: number; weight: number; tickets: number }
    onTime: { score: number; weight: number; tasks: number }
  }
  trend: 'up' | 'down' | 'stable'
  recommendation: string
}

export function SatisfactionScorecard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<SatisfactionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/satisfaction`)
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  if (loading) return <Skeleton className="h-64 w-full" />
  if (!data) return null

  const gradeColor: Record<string, string> = {
    A: 'var(--success)',
    B: 'var(--info)',
    C: 'var(--warning)',
    D: 'var(--destructive)',
  }

  const scoreColor = data.score >= 85 ? 'var(--success)' : data.score >= 70 ? 'var(--info)' : data.score >= 50 ? 'var(--warning)' : 'var(--destructive)'

  const radarPoints = [
    { label: 'NPS', value: (data.breakdown.nps.score / 100) * 80, angle: 0 },
    { label: 'Check-ins', value: (data.breakdown.checkins.score / 100) * 80, angle: Math.PI / 2 },
    { label: 'SLA', value: (data.breakdown.sla.score / 100) * 80, angle: Math.PI },
    { label: 'Prazo', value: (data.breakdown.onTime.score / 100) * 80, angle: (3 * Math.PI) / 2 },
  ]

  const cx = 80; const cy = 80;
  const radarPath = radarPoints.map((p, i) => {
    const x = cx + p.value * Math.cos(p.angle - Math.PI / 2)
    const y = cy + p.value * Math.sin(p.angle - Math.PI / 2)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ') + ' Z'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" /> Score de Satisfacao
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[32px] font-[600] leading-none" style={{ color: scoreColor }}>
              {data.score}
            </p>
            <p className="text-[11px] text-[var(--text-3)] mt-1">de 100</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge
              variant={data.grade === 'A' ? 'success' : data.grade === 'B' ? 'info' : data.grade === 'C' ? 'warning' : 'destructive'}
              className="text-lg font-bold px-3 py-1"
            >
              {data.grade}
            </Badge>
            <span className="flex items-center gap-1 text-[11px]">
              {data.trend === 'up' ? <TrendingUp className="h-3 w-3 text-[var(--success)]" /> :
               data.trend === 'down' ? <TrendingDown className="h-3 w-3 text-[var(--destructive)]" /> :
               <Minus className="h-3 w-3 text-[var(--text-3)]" />}
              <span className={data.trend === 'up' ? 'text-[var(--success)]' : data.trend === 'down' ? 'text-[var(--destructive)]' : 'text-[var(--text-3)]'}>
                {data.trend === 'up' ? 'Melhorando' : data.trend === 'down' ? 'Caindo' : 'Estavel'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
            {[20, 40, 60, 80].map(r => (
              <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="0.5" />
            ))}
            <line x1={cx} y1={20} x2={cx} y2={140} stroke="var(--border)" strokeWidth="0.5" />
            <line x1={20} y1={cy} x2={140} y2={cy} stroke="var(--border)" strokeWidth="0.5" />
            <path d={radarPath} fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" strokeWidth="1.5" />
            {radarPoints.map((p, i) => {
              const x = cx + 85 * Math.cos(p.angle - Math.PI / 2)
              const y = cy + 85 * Math.sin(p.angle - Math.PI / 2)
              return (
                <g key={i}>
                  <circle cx={cx + p.value * Math.cos(p.angle - Math.PI / 2)} cy={cy + p.value * Math.sin(p.angle - Math.PI / 2)} r="3" fill="var(--accent)" />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-3)" fontFamily="inherit">
                    {p.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="space-y-2 flex-1">
            {Object.entries(data.breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-2)] capitalize">{key === 'onTime' ? 'Prazo' : key.toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(val.score / 100) * 100}%` }} />
                  </div>
                  <span className="text-[var(--text)] font-[500] w-6 text-right">{val.score}</span>
                  <span className="text-[var(--text-3)]">({val.weight}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.recommendation && (
          <div className="p-2.5 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--info)] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--text)]">{data.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
