'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BurndownProps {
  ideal: { date: string; remaining: number }[]
  actual: { date: string; remaining: number }[]
  sprintName?: string
  totalTasks?: number
}

export function BurndownChart({ ideal, actual, sprintName, totalTasks }: BurndownProps) {
  const data = ideal.map((i, idx) => ({ date: i.date.slice(5), ideal: i.remaining, actual: actual[idx]?.remaining ?? null }))

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
          Burndown{sprintName ? ` — ${sprintName}` : ''}{totalTasks ? ` (${totalTasks} tarefas)` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg">
                    <p className="text-xs font-medium text-[var(--text)]">Dia {label}</p>
                    {payload.map((p: any, i: number) => <p key={i} className="text-xs" style={{ color: p.color }}>{p.name === 'ideal' ? 'Ideal' : 'Real'}: {p.value} tarefas</p>)}
                  </div>
                )
              }} />
              <Line type="monotone" dataKey="ideal" stroke="var(--text-3)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Ideal" />
              <Line type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2, fill: 'var(--accent)' }} name="Real" connectNulls />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
