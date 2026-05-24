'use client'

import { useEffect, useState } from 'react'

interface HeatmapData {
  heatmap: number[][]
  maxCount: number
  total: number
  peak: { day: number; hour: number; count: number }
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

export function TicketHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/ticket-heatmap')
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-64 bg-[var(--surface-2)] rounded-lg animate-pulse" />
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-3)] text-sm">
        Nenhum ticket nos ultimos 90 dias
      </div>
    )
  }

  const getOpacity = (count: number) => {
    if (count === 0) return 0.03
    return 0.1 + (count / Math.max(data.maxCount, 1)) * 0.9
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-[500] text-[var(--text)]">
          Pico de abertura: {dayNames[data.peak.day]} as {data.peak.hour}h ({data.peak.count} tickets)
        </p>
        <span className="text-[10px] text-[var(--text-3)]">{data.total} tickets no periodo</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `50px repeat(24, 22px)`, gap: '2px' }}>
          <div className="h-5" />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-[9px] text-[var(--text-3)] flex items-end justify-center">
              {h % 3 === 0 ? `${h}` : ''}
            </div>
          ))}

          {dayNames.map((day, d) => (
            <div key={d} className="contents">
              <div className="text-[10px] text-[var(--text-3)] flex items-center justify-end pr-1">{day}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const count = data.heatmap[d][h]
                const opacity = getOpacity(count)
                return (
                  <div
                    key={h}
                    className="h-[20px] w-[20px] rounded"
                    style={{ backgroundColor: `var(--accent)`, opacity }}
                    title={`${day} ${h}h: ${count} tickets`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--text-3)]">
        <span>Menos</span>
        <div className="flex items-center gap-0.5">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map(op => (
            <div key={op} className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--accent)', opacity: op }} />
          ))}
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
