'use client'

import { useEffect, useState } from 'react'

interface HeatmapProps {
  data: Record<string, number>
  max: number
}

function getColor(count: number, max: number): string {
  if (count === 0) return 'var(--surface-2)'
  const pct = count / max
  if (pct <= 0.25) return 'rgba(232,98,42,0.2)'
  if (pct <= 0.5) return 'rgba(232,98,42,0.5)'
  if (pct <= 0.75) return 'rgba(232,98,42,0.75)'
  return 'var(--accent)'
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function ActivityHeatmap({ data, max }: HeatmapProps) {
  const [cells, setCells] = useState<{ date: string; count: number; x: number; y: number }[]>([])

  useEffect(() => {
    const today = new Date()
    const result: { date: string; count: number; x: number; y: number }[] = []

    for (let week = 52; week >= 0; week--) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(today)
        d.setDate(d.getDate() - (week * 7 + (6 - day)))
        const key = d.toISOString().slice(0, 10)
        result.push({
          date: key,
          count: data[key] || 0,
          x: 52 - week,
          y: day,
        })
      }
    }
    setCells(result)
  }, [data])

  const weekLabels = cells.filter((_, i) => i % 7 === 0)

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-0.5">
        <div className="flex gap-0.5 ml-8 mb-1">
          {MONTHS.map((m, i) => (
            <div key={m} className="text-[9px] text-[var(--text-3)]" style={{ width: i < 5 ? 52 : 56 }}>
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1">
            {['', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
              <div key={i} className="h-3 w-6 flex items-center text-[8px] text-[var(--text-3)]">{l}</div>
            ))}
          </div>
          {Array.from({ length: 53 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6].map(row => {
                const cell = cells.find(c => c.x === col && c.y === row)
                const count = cell?.count || 0
                return (
                  <div
                    key={`${col}-${row}`}
                    title={cell?.date ? `${cell.date}: ${count} tarefas` : ''}
                    className="rounded-sm cursor-default"
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: getColor(count, max),
                      borderRadius: 2,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end text-[9px] text-[var(--text-3)]">
          <span>Menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <div
              key={pct}
              className="rounded-sm"
              style={{ width: 10, height: 10, backgroundColor: getColor(max * pct, max), borderRadius: 2 }}
            />
          ))}
          <span>Mais</span>
        </div>
      </div>
    </div>
  )
}
