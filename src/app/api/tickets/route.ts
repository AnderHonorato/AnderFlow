import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { sendWebhook } from '@/lib/webhook-sender'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, image: true, company: true } },
          assignee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ])

    return NextResponse.json({
      data: tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { title, description, priority, category, assigneeId } = body

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        category,
        creatorId: user.id,
        assigneeId,
      },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    })

    fetch(`${request.nextUrl.origin}/api/ai/analyze-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
      body: JSON.stringify({ ticketId: ticket.id }),
    }).catch(() => {})

    sendWebhook('ticket_created', {
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt?.toISOString(),
    }).catch(() => {})

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar ticket' }, { status: 500 })
  }
}
