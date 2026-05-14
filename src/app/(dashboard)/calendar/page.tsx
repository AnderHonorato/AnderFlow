'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  FolderKanban,
  Users,
} from 'lucide-react'

const events = [
  { id: '1', title: 'Sprint Review - E-commerce', time: '09:00', duration: '1h', type: 'meeting', color: 'bg-primary' },
  { id: '2', title: 'Entrega Frontend', time: '12:00', duration: '', type: 'deadline', color: 'bg-destructive' },
  { id: '3', title: 'Call com TechStore', time: '14:00', duration: '30min', type: 'meeting', color: 'bg-info' },
  { id: '4', title: 'Review Design - App Delivery', time: '16:00', duration: '45min', type: 'review', color: 'bg-warning' },
]

const upcomingEvents = [
  { title: 'Daily Standup', time: 'Amanhã, 09:00', type: 'meeting' },
  { title: 'Prazo: Dashboard Analytics', time: 'Sex, 18 Mar', type: 'deadline' },
  { title: 'Reunião com DataCorp', time: 'Seg, 21 Mar', type: 'meeting' },
  { title: 'Sprint Planning', time: 'Seg, 21 Mar', type: 'planning' },
]

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const currentMonth = Array.from({ length: 35 }, (_, i) => {
  const day = i - 4
  return { day: day > 0 && day <= 31 ? day : null, today: day === 13, hasEvent: [5, 13, 15, 18, 21, 25].includes(day) }
})

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Eventos, prazos e reuniões
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-medium">Março 2024</CardTitle>
              <Button variant="ghost" size="icon-sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">Hoje</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {currentMonth.map((cell, i) => (
                <div
                  key={i}
                  className={`relative h-20 p-1.5 border border-border/50 rounded-md ${
                    cell.today ? 'bg-primary/5 border-primary/30' : cell.day ? 'hover:bg-muted/50' : 'bg-muted/20'
                  } ${cell.day ? 'cursor-pointer' : ''}`}
                >
                  {cell.day && (
                    <>
                      <span className={`text-xs font-medium ${cell.today ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground' : ''}`}>
                        {cell.day}
                      </span>
                      {cell.hasEvent && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                          <div className="h-1 w-1 rounded-full bg-warning" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Hoje - 13 Mar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`w-1 h-full min-h-[40px] rounded-full ${event.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                      {event.duration && <span className="text-xs text-muted-foreground">&middot; {event.duration}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    {event.type === 'meeting' && <Video className="h-4 w-4 text-info" />}
                    {event.type === 'deadline' && <Clock className="h-4 w-4 text-destructive" />}
                    {event.type === 'planning' && <FolderKanban className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
