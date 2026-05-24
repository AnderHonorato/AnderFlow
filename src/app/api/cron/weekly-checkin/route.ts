import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jose from 'jose'
import { sendTemplateEmail } from '@/lib/email/envio'

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const activeProjects = await prisma.project.findMany({
      where: {
        isArchived: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: { id: true, clientId: true, name: true },
    })

    const clientsWithProjects = [...new Set(activeProjects.map(p => p.clientId).filter(Boolean))]
    const week = getWeekNumber(new Date())
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')

    let sent = 0

    for (const clientId of clientsWithProjects) {
      const clientProjects = activeProjects.filter(p => p.clientId === clientId)

      const existing = await prisma.weeklyCheckin.findFirst({
        where: { clientId, week },
      })

      if (existing) continue

      const now = new Date()
      const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const jwt = await new jose.SignJWT({ clientId, week })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(exp.getTime() / 1000))
        .sign(secret)

      await prisma.notification.create({
        data: {
          userId: clientId,
          type: 'SYSTEM',
          title: 'Check-in semanal de satisfação',
          message: 'Como você se sente em relação ao andamento dos seus projetos esta semana? Leva 5 segundos!',
          metadata: JSON.stringify({
            url: `/portal/checkin/${jwt}`,
            projectId: clientProjects[0]?.id,
            week,
          }),
        },
      })

      sent++
    }

    return NextResponse.json({ sent, week, clients: clientsWithProjects.length })
  } catch (error: any) {
    console.error('[cron:weekly-checkin]', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  } finally {
    try {
      await sendWeeklyAdminReport()
    } catch (err: any) {
      console.error('[cron:weekly-report]', err?.message || err)
    }
  }
}

async function sendWeeklyAdminReport() {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [updatedProjects, ticketsCreated, ticketsResolved, paidInvoices, inactiveClients] = await Promise.all([
    prisma.project.findMany({
      where: { updatedAt: { gte: weekAgo }, isArchived: false },
      select: { name: true, client: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.ticket.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', updatedAt: { gte: weekAgo } } }),
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: weekAgo } },
      _sum: { total: true },
    }),
    prisma.user.findMany({
      where: {
        role: 'CLIENT',
        isActive: true,
        projects: { none: { updatedAt: { gte: new Date(now.getTime() - 14 * 86400000) } } },
      },
      select: { name: true, email: true },
    }),
  ])

  if (updatedProjects.length === 0 && ticketsCreated === 0 && ticketsResolved === 0) return

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'OWNER'] }, isActive: true },
    select: { email: true },
  })

  const weekStart = new Date(weekAgo).toLocaleDateString('pt-BR')
  const weekEnd = new Date(now).toLocaleDateString('pt-BR')
  const revenue = paidInvoices._sum.total || 0
  const inactiveList = inactiveClients.map(c => c.name).slice(0, 5).join(', ') || 'Nenhum'

  for (const admin of admins) {
    if (!admin.email) continue
    await sendTemplateEmail(admin.email, 'project_update', {
      projectName: `Resumo Semanal (${weekStart} - ${weekEnd})`,
      projectStatus: `Projetos: ${updatedProjects.length} atualizados · Tickets: ${ticketsCreated} criados / ${ticketsResolved} resolvidos`,
      progress: 0,
      invoiceAmount: revenue / 100,
      invoiceDueDate: `Receita: R$ ${(revenue / 100).toFixed(2)}`,
      daysUntilDue: inactiveClients.length,
      ticketTitle: inactiveList ? `Inativos >14d: ${inactiveList}` : 'Nenhum cliente inativo',
      replyPreview: `${updatedProjects.length > 0 ? updatedProjects.map(p => `- ${p.name} (${p.client?.name})`).join('\n') : 'Nenhum projeto atualizado'}`,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    }).catch((err) => { console.error('[weekly-report email]', err?.message || err) })
  }
}
