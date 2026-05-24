import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const billable = searchParams.get('billable')

    const filters: any = {}
    if (clientId) filters.userId = clientId
    if (projectId) filters.projectId = projectId
    if (startDate || endDate) {
      filters.date = {}
      if (startDate) filters.date.gte = new Date(startDate)
      if (endDate) filters.date.lte = new Date(endDate)
    }
    if (billable === 'true') filters.billable = true

    const entries = await prisma.timeEntry.findMany({
      where: filters,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, client: { select: { id: true, name: true, company: true } } } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    })

    const byClient: Record<string, { name: string; company?: string; hours: number; amount: number }> = {}
    const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0)
    let totalBillable = 0

    entries.forEach(e => {
      const clientId = e.project?.client?.id || 'unknown'
      const clientName = e.project?.client?.name || 'N/A'
      const clientCompany = e.project?.client?.company || undefined
      const hours = e.hours || 0
      const amount = hours * 120

      if (e.billable) totalBillable += amount

      if (!byClient[clientId]) {
        byClient[clientId] = { name: clientName, company: clientCompany, hours: 0, amount: 0 }
      }
      byClient[clientId].hours += hours
      byClient[clientId].amount += amount
    })

    return NextResponse.json({
      data: {
        entries: entries.map(e => ({
          id: e.id,
          date: e.date?.toISOString(),
          hours: e.hours,
          billable: e.billable,
          description: e.description,
          user: e.user,
          project: { id: e.project?.id, name: e.project?.name, client: e.project?.client },
          task: e.task ? { id: e.task.id, title: e.task.title } : null,
        })),
        summary: {
          totalHours,
          totalBillable,
          byClient: Object.entries(byClient).map(([id, data]) => ({ id, ...data })),
        },
      },
    })
  } catch (error: any) {
    console.error('[reports:hours]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro ao buscar horas' }, { status: 500 })
  }
}
