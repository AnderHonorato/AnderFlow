'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderKanban,
  Download,
} from 'lucide-react'
import { getFeriadosBR } from '@/lib/feriados-br'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: string
  color: string
  href: string
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isToday(day: number, month: number, year: number): boolean {
  const today = new Date()
  return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
}

const typeIcons: Record<string, React.ReactNode> = {
  deadline: <Clock className="h-4 w-4 text-destructive" />,
  invoice: <FileText className="h-4 w-4 text-warning" />,
  project: <FolderKanban className="h-4 w-4 text-accent" />,
}

const typeLabels: Record<string, string> = {
  deadline: 'Prazo',
  invoice: 'Fatura',
  project: 'Entrega',
}

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/calendar-events')
      .then(r => r.json())
      .then(json => { setEvents(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarCells = useMemo(() => {
    const cells: { day: number | null; dateStr: string | null }[] = []
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, dateStr })
    }
    while (cells.length < 42) {
      cells.push({ day: null, dateStr: null })
    }
    return cells
  }, [daysInMonth, firstDay, currentYear, currentMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(e => {
      const dateStr = e.date.slice(0, 10)
      const existing = map.get(dateStr) || []
      existing.push(e)
      map.set(dateStr, existing)
    })
    return map
  }, [events])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayEvents = eventsByDay.get(todayStr) || []
  const upcomingEvents = events
    .filter(e => e.date >= new Date().toISOString())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const holidays = useMemo(() => getFeriadosBR(currentYear), [currentYear])
  const holidaysByDate = useMemo(() => {
    const map = new Map<string, string>()
    holidays.forEach(h => map.set(h.date, h.name))
    return map
  }, [holidays])

  const goToToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56 mt-1.5" /></div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[500px]" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Calendario</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Eventos, prazos e reunioes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => window.open('/api/calendar-events/export', '_blank')}>
            <Download className="w-[12px] h-[12px]" /> Exportar ICS
          </Button>
          <Button size="sm" onClick={goToToday} variant="outline" className="h-8 text-[11px]">
            Hoje
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-[15px] font-[500]">
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[11px] font-[500] text-[var(--text-3)] py-2">
                  {day}
                </div>
              ))}
               {calendarCells.map((cell, i) => {
                 const dayEvents = cell.dateStr ? (eventsByDay.get(cell.dateStr) || []) : []
                 const cellIsToday = cell.day !== null && isToday(cell.day, currentMonth, currentYear)
                 const holidayName = cell.dateStr ? holidaysByDate.get(cell.dateStr) : null
                 return (
                   <div
                     key={i}
                     className={`relative h-[90px] p-1.5 border border-[var(--border)] rounded-md ${
                       cellIsToday
                         ? 'bg-[var(--accent-subtle)] border-[var(--accent)]/30'
                         : cell.day
                           ? 'hover:bg-[var(--surface-hover)] cursor-pointer'
                           : 'bg-[var(--surface-2)]/30 opacity-40'
                     }`}
                   >
                     {cell.day && (
                       <>
                         <span className={`text-[12px] font-[500] ${
                           cellIsToday
                             ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white'
                             : 'text-[var(--text-2)]'
                         }`}>
                           {cell.day}
                         </span>
                         {holidayName && (
                           <div className="absolute top-1 right-1" title={holidayName}>
                             <span className="text-[10px]">🇧🇷</span>
                           </div>
                         )}
                         {holidayName && dayEvents.length === 0 && (
                           <div className="absolute bottom-1.5 left-1.5 right-1.5">
                             <span className="text-[8px] text-[var(--accent)] truncate block leading-tight">{holidayName}</span>
                           </div>
                         )}
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-0.5">
                            {dayEvents.slice(0, 2).map((evt) => (
                              <Link
                                key={evt.id}
                                href={evt.href}
                                className="text-[9px] truncate rounded px-1 py-px text-white opacity-90 hover:opacity-100"
                                style={{ background: evt.color === 'bg-destructive' ? 'var(--destructive)' : evt.color === 'bg-warning' ? 'var(--warning)' : 'var(--accent)' }}
                              >
                                {evt.title}
                              </Link>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] text-[var(--text-3)] px-1">
                                +{dayEvents.length - 2} mais
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-[500]">
                Hoje - {today.getDate()} {monthNames[today.getMonth()].slice(0, 3)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayEvents.length === 0 ? (
                <p className="text-[12px] text-[var(--text-3)] py-4 text-center">Nenhum evento hoje</p>
              ) : (
                todayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--surface-hover)] group"
                  >
                    <div
                      className="w-1 h-full min-h-[40px] rounded-full shrink-0"
                      style={{
                        background:
                          event.color === 'bg-destructive' ? 'var(--destructive)' :
                          event.color === 'bg-warning' ? 'var(--warning)' :
                          'var(--accent)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] text-[var(--text)] group-hover:text-[var(--accent)]">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {typeLabels[event.type] || event.type}
                        </Badge>
                        <span className="text-[11px] text-[var(--text-3)]">
                          {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) !== '00:00'
                            ? new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : 'Dia todo'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-[500]">Proximos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-[12px] text-[var(--text-3)] py-4 text-center">Nenhum evento futuro</p>
              ) : (
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      {typeIcons[event.type] || <Clock className="h-4 w-4 text-[var(--text-3)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] text-[var(--text)] group-hover:text-[var(--accent)] truncate">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-3)]">
                        {new Date(event.date).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
