import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ tips: [] })

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || ''

    const tips: { type: string; message: string; link?: string }[] = []

    if (page === 'projects') {
      const noAssignee = await prisma.project.count({
        where: { status: 'IN_PROGRESS', tasks: { some: { assigneeId: null } } },
      })
      if (noAssignee > 0) {
        tips.push({ type: 'warning', message: `${noAssignee} projetos com tarefas sem responsavel`, link: '/projects' })
      }
    }

    if (page === 'financial') {
      const overdueInvoices = await prisma.invoice.count({
        where: { status: 'SENT', dueDate: { lt: new Date() } },
      })
      if (overdueInvoices > 0) {
        tips.push({ type: 'critical', message: `${overdueInvoices} faturas vencidas`, link: '/financial' })
      }
    }

    if (page === 'tickets') {
      const dayAgo = new Date(Date.now() - 24 * 3600000)
      const criticalOpen = await prisma.ticket.count({
        where: { priority: 'CRITICAL', status: { not: 'RESOLVED' }, createdAt: { lt: dayAgo } },
      })
      if (criticalOpen > 0) {
        tips.push({ type: 'critical', message: `Ticket critico aberto ha mais de 24h`, link: '/tickets' })
      }
    }

    if (page === 'crm') {
      const newLeads = await prisma.lead.count({
        where: { status: 'NEW', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      })
      if (newLeads > 0) {
        tips.push({ type: 'info', message: `${newLeads} novos leads esta semana`, link: '/crm' })
      }
    }

    return NextResponse.json({ tips: tips.slice(0, 2) })
  } catch {
    return NextResponse.json({ tips: [] })
  }
}
