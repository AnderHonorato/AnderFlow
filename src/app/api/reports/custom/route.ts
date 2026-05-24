import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const metric = searchParams.get('metric') || 'revenue'
  const groupBy = searchParams.get('groupBy') || 'month'
  const dateRange = parseInt(searchParams.get('dateRange') || '90')
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')

  const since = new Date()
  since.setDate(since.getDate() - dateRange)

  let data: any[] = []

  switch (metric) {
    case 'revenue': {
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: since },
          status: 'PAID',
        },
        include: { invoice: { include: { project: true } } },
        orderBy: { createdAt: 'asc' },
      })

      const grouped: Record<string, number> = {}
      for (const p of payments) {
        const d = new Date(p.createdAt)
        let key = ''
        if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        else if (groupBy === 'week') {
          const startOfWeek = new Date(d)
          startOfWeek.setDate(d.getDate() - d.getDay())
          key = startOfWeek.toISOString().slice(0, 10)
        } else key = d.toISOString().slice(0, 10)
        grouped[key] = (grouped[key] || 0) + p.amount
      }
      data = Object.entries(grouped).map(([label, value]) => ({ label, value }))
      break
    }
    case 'projects': {
      const projects = await prisma.project.findMany({
        where: {
          createdAt: { gte: since },
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'asc' },
      })

      const grouped: Record<string, number> = {}
      for (const p of projects) {
        const d = new Date(p.createdAt)
        let key = ''
        if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        else key = d.toISOString().slice(0, 10)
        grouped[key] = (grouped[key] || 0) + 1
      }
      data = Object.entries(grouped).map(([label, value]) => ({ label, value }))
      break
    }
    case 'tickets': {
      const tickets = await prisma.ticket.findMany({
        where: {
          createdAt: { gte: since },
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'asc' },
      })

      const grouped: Record<string, number> = {}
      for (const t of tickets) {
        const d = new Date(t.createdAt)
        let key = ''
        if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        else key = d.toISOString().slice(0, 10)
        grouped[key] = (grouped[key] || 0) + 1
      }
      data = Object.entries(grouped).map(([label, value]) => ({ label, value }))
      break
    }
    case 'hours': {
      const entries = await prisma.timeEntry.findMany({
        where: { date: { gte: since } },
        orderBy: { date: 'asc' },
      })

      const grouped: Record<string, number> = {}
      for (const e of entries) {
        const d = new Date(e.date || new Date())
        let key = ''
        if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        else key = d.toISOString().slice(0, 10)
        grouped[key] = (grouped[key] || 0) + (e.hours || 0)
      }
      data = Object.entries(grouped).map(([label, value]) => ({ label: Number(value.toFixed(1)), value: Number(value.toFixed(1)) }))
      break
    }
    case 'clients': {
      const projects = await prisma.project.findMany({
        where: { createdAt: { gte: since } },
        include: { client: { select: { name: true } } },
      })

      const grouped: Record<string, number> = {}
      for (const p of projects) {
        const name = p.client?.name || 'Sem cliente'
        grouped[name] = (grouped[name] || 0) + 1
      }
      data = Object.entries(grouped).map(([label, value]) => ({ label, value }))
      break
    }
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { name, config } = await req.json()

  if (!name || !config) {
    return NextResponse.json({ error: 'Nome e config são obrigatórios' }, { status: 400 })
  }

  const report = await prisma.savedReport.create({
    data: {
      name,
      config,
      ownerId: user.id,
    },
  })

  return NextResponse.json({ data: report }, { status: 201 })
}
