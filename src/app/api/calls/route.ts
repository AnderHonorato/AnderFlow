import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (!isAdmin(user)) {
      where.clientId = user.id
    }
    if (projectId) where.projectId = projectId
    if (filter === 'future') where.scheduledAt = { gte: new Date() }
    if (filter === 'past') where.scheduledAt = { lt: new Date() }

    const calls = await prisma.scheduledCall.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    })

    return NextResponse.json({ data: calls })
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, clientId, title, description, scheduledAt, duration, meetLink } = body

    if (!clientId || !title || !scheduledAt) {
      return NextResponse.json({ error: 'clientId, title e scheduledAt sao obrigatorios' }, { status: 400 })
    }

    const call = await prisma.scheduledCall.create({
      data: {
        projectId: projectId || null,
        clientId,
        scheduledBy: user.id,
        title,
        description: description || null,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        meetLink: meetLink || null,
      },
    })

    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'CALL',
        title: 'Nova reuniao agendada',
        message: `"${title}" em ${new Date(scheduledAt).toLocaleDateString('pt-BR')} as ${new Date(scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        metadata: JSON.stringify({ callId: call.id }),
      },
    })

    return NextResponse.json({ data: call }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar call' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, notes } = body

    const data: any = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes

    const call = await prisma.scheduledCall.update({ where: { id }, data })

    return NextResponse.json({ data: call })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar call' }, { status: 500 })
  }
}
