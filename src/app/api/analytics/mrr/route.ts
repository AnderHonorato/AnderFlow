import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 80) return unauthorizedResponse()

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthStart = new Date(currentYear, currentMonth, 1)
  const monthEnd = new Date(currentYear, currentMonth + 1, 0)
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
  const lastMonthEnd = new Date(currentYear, currentMonth, 0)

  // Current MRR: sum of all recurring invoices for this month
  const recurringInvoices = await prisma.invoice.findMany({
    where: {
      isRecurring: true,
      status: { in: ['PAID', 'SENT', 'DRAFT'] },
      dueDate: { lte: monthEnd },
    },
    select: { total: true, clientId: true, createdAt: true, dueDate: true, status: true },
  })

  const mrr = recurringInvoices
    .filter(i => new Date(i.dueDate) <= monthEnd && new Date(i.dueDate) >= monthStart)
    .reduce((sum, i) => sum + i.total, 0)

  // Last month MRR for variation
  const lastMonthMRR = recurringInvoices
    .filter(i => new Date(i.dueDate) <= lastMonthEnd && new Date(i.dueDate) >= lastMonthStart)
    .reduce((sum, i) => sum + i.total, 0)

  const mrrChange = lastMonthMRR > 0 ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0

  // Client count for recurring
  const recurringClientIds = new Set(recurringInvoices.map(i => i.clientId))
  
  // Churn: clients who stopped having recurring invoices
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  const pastRecurringClients = await prisma.invoice.groupBy({
    by: ['clientId'],
    where: {
      isRecurring: true,
      createdAt: { gte: threeMonthsAgo },
    },
  })
  const pastClientIds = new Set(pastRecurringClients.map(c => c.clientId))
  const churnedClients = [...pastClientIds].filter(id => !recurringClientIds.has(id))
  const churnRate = pastClientIds.size > 0 ? (churnedClients.length / pastClientIds.size) * 100 : 0

  // LTV: average total paid per client
  const clientPayments = await prisma.invoice.groupBy({
    by: ['clientId'],
    where: { status: 'PAID', isRecurring: true },
    _sum: { total: true },
  })
  const ltv = clientPayments.length > 0
    ? clientPayments.reduce((sum, c) => sum + (c._sum.total || 0), 0) / clientPayments.length
    : 0

  // 12-month MRR history
  const mrrHistory = []
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1)
    const monthStartH = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEndH = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    const monthTotal = recurringInvoices
      .filter(inv => new Date(inv.dueDate) <= monthEndH && new Date(inv.dueDate) >= monthStartH)
      .reduce((sum, inv) => sum + inv.total, 0)

    mrrHistory.push({
      month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      value: Math.round(monthTotal * 100) / 100,
    })
  }

  // Projection next 3 months
  const avgLast3 = mrrHistory.slice(-3).reduce((s, h) => s + h.value, 0) / 3
  const projection = []
  for (let i = 1; i <= 3; i++) {
    const projDate = new Date(currentYear, currentMonth + i, 1)
    projection.push({
      month: projDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      value: Math.round(avgLast3 * 100) / 100,
    })
  }

  // Upcoming renewals (next 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  const upcomingRenewals = await prisma.invoice.findMany({
    where: {
      isRecurring: true,
      status: { in: ['SENT', 'DRAFT'] },
      dueDate: { gte: now, lte: thirtyDaysFromNow },
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json({
    data: {
      mrr: Math.round(mrr * 100) / 100,
      mrrChange: Math.round(mrrChange * 10) / 10,
      churnRate: Math.round(churnRate * 10) / 10,
      ltv: Math.round(ltv * 100) / 100,
      recurringClients: recurringClientIds.size,
      history: mrrHistory,
      projection,
      upcomingRenewals: upcomingRenewals.map(r => ({
        id: r.id,
        clientName: r.client.name,
        company: r.client.company,
        amount: r.total,
        dueDate: r.dueDate,
      })),
    },
  })
}
