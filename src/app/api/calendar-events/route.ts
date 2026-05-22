import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    let events: { id: string; title: string; date: string; type: string; color: string; href: string }[] = []

    const deadlines = await prisma.task.findMany({
      where: { dueDate: { not: null } },
      select: { id: true, title: true, dueDate: true, project: { select: { name: true, id: true } } },
    })

    deadlines.forEach(t => {
      if (t.dueDate) {
        events.push({
          id: `deadline-${t.id}`,
          title: `${t.title} (${t.project?.name || 'Projeto'})`,
          date: t.dueDate.toISOString(),
          type: 'deadline',
          color: 'bg-destructive',
          href: `/projects/${t.project?.id}`,
        })
      }
    })

    const invoices = await prisma.invoice.findMany({
      where: { status: { not: 'PAID' } },
      select: { id: true, number: true, dueDate: true, projectId: true },
    })

    invoices.forEach(i => {
      if (i.dueDate) {
        events.push({
          id: `invoice-${i.id}`,
          title: `Fatura #${i.number}${i.projectId ? '' : ''}`,
          date: i.dueDate.toISOString(),
          type: 'invoice',
          color: 'bg-warning',
          href: `/invoices`,
        })
      }
    })

    const projects = await prisma.project.findMany({
      where: { deadline: { not: null } },
      select: { id: true, name: true, deadline: true },
    })

    projects.forEach(p => {
      if (p.deadline) {
        events.push({
          id: `project-${p.id}`,
          title: `Entrega: ${p.name}`,
          date: p.deadline.toISOString(),
          type: 'project',
          color: 'bg-accent',
          href: `/projects/${p.id}`,
        })
      }
    })

    return NextResponse.json({ data: events })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao buscar eventos' }, { status: 500 })
  }
}
