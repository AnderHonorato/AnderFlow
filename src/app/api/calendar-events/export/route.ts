import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const filters: any = {}
  if (startDate || endDate) {
    filters.date = {}
    if (startDate) filters.date.gte = new Date(startDate)
    if (endDate) filters.date.lte = new Date(endDate)
  }

  const [deadlines, invoices] = await Promise.all([
    prisma.task.findMany({
      where: { dueDate: { not: null }, ...filters },
      select: { id: true, title: true, dueDate: true, project: { select: { name: true, id: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { not: 'PAID' } },
      select: { id: true, number: true, dueDate: true, projectId: true },
    }),
  ])

  const events: { id: string; title: string; date: Date; description: string }[] = []

  deadlines.forEach(t => {
    if (t.dueDate) events.push({
      id: `task-${t.id}`,
      title: `Prazo: ${t.title}`,
      date: new Date(t.dueDate),
      description: `Projeto: ${t.project?.name || 'N/A'}`,
    })
  })

  invoices.forEach(i => {
    if (i.dueDate) events.push({
      id: `invoice-${i.id}`,
      title: `Vencimento: Fatura #${i.number}`,
      date: new Date(i.dueDate),
      description: `Fatura ${i.number}`,
    })
  })

  const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ANDERFLOW//Sistemas//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.map(ev => [
      'BEGIN:VEVENT',
      `UID:${ev.id}@anderflow`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(ev.date)}`,
      `SUMMARY:${ev.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(ev.description || '').replace(/,/g, '\\,')}`,
      'END:VEVENT',
    ].join('\r\n')),
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename=anderflow-agenda.ics',
    },
  })
}
