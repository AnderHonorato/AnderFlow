'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IconArrowLeft, IconClock } from '@/components/icons'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimeEntry {
  id: string
  taskId: string | null
  startAt: string | null
  endAt: string | null
  duration: number | null
  createdAt: string
  task?: { id: string; title: string } | null
}

interface DayGroup {
  date: string
  totalSeconds: number
  entries: TimeEntry[]
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600
  return hours.toFixed(1)
}

export default function TimeReportPage() {
  const { id } = useParams<{ id: string }>()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/time-entries?projectId=${encodeURIComponent(id)}`).then(r => r.json()),
      fetch(`/api/projects/${id}`).then(r => r.json()),
    ]).then(([timeJson, projJson]) => {
      setEntries(timeJson.data || [])
      setProject(projJson.data || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const groupedByDay: DayGroup[] = []
  const dayMap = new Map<string, TimeEntry[]>()

  entries.forEach(e => {
    const dateStr = e.startAt
      ? format(new Date(e.startAt), 'yyyy-MM-dd')
      : format(new Date(e.createdAt), 'yyyy-MM-dd')
    const existing = dayMap.get(dateStr) || []
    existing.push(e)
    dayMap.set(dateStr, existing)
  })

  dayMap.forEach((dayEntries, date) => {
    const totalSeconds = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    groupedByDay.push({ date, totalSeconds, entries: dayEntries })
  })

  groupedByDay.sort((a, b) => b.date.localeCompare(a.date))

  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0)
  const totalHours = totalSeconds / 3600

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`} className="inline-flex items-center gap-2 text-[13px] text-[var(--text-3)] hover:text-[var(--text)]">
            <IconArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">
            Horas do Projeto{project ? `: ${project.name}` : ''}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <IconClock className="w-[14px] h-[14px]" />
            Resumo de Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Total de horas</p>
              <p className="text-[20px] font-[500] text-[var(--accent)]">{formatHours(totalSeconds)}h</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Registros</p>
              <p className="text-[20px] font-[500] text-[var(--text)]">{entries.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Dias trabalhados</p>
              <p className="text-[20px] font-[500] text-[var(--text)]">{groupedByDay.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Média/dia</p>
              <p className="text-[20px] font-[500] text-[var(--text)]">
                {groupedByDay.length > 0 ? formatHours(totalSeconds / groupedByDay.length) + 'h' : '0h'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13px]">Horas por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedByDay.length === 0 ? (
            <div className="py-8 text-center">
              <IconClock className="w-12 h-12 text-[var(--text-3)] mx-auto mb-2" />
              <p className="text-[13px] text-[var(--text-3)]">Nenhum registro de horas encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Data</th>
                    <th className="text-left py-2 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Registros</th>
                    <th className="text-right py-2 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDay.map((day) => (
                    <tr key={day.date} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2.5 text-[12px] text-[var(--text)]">
                        {format(new Date(day.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                      </td>
                      <td className="py-2.5 text-[12px] text-[var(--text-2)]">
                        {day.entries.length} registro{day.entries.length !== 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 text-[12px] font-[500] text-[var(--accent)] text-right">
                        {formatHours(day.totalSeconds)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-2.5 text-[12px] font-[500] text-[var(--text)]">Total</td>
                    <td className="py-2.5 text-[12px] text-[var(--text-2)]">{entries.length} registros</td>
                    <td className="py-2.5 text-[12px] font-[600] text-[var(--accent)] text-right">{formatHours(totalSeconds)}h</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
