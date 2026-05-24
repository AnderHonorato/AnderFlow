import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET() {
  try {
    const [components, incidents] = await Promise.all([
      prisma.statusComponent.findMany({ orderBy: { order: 'asc' } }),
      prisma.statusIncident.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      data: { components, incidents, updatedAt: new Date().toISOString() },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { componentId, status, incidentId, resolved } = body

    if (componentId && status) {
      await prisma.statusComponent.update({
        where: { id: componentId },
        data: { status },
      })
      return NextResponse.json({ ok: true })
    }

    if (incidentId && resolved) {
      await prisma.statusIncident.update({
        where: { id: incidentId },
        data: { resolvedAt: new Date(), status: 'resolved' },
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { title, message } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const incident = await prisma.statusIncident.create({
      data: { title: title.trim(), message: message || '', status: 'investigating' },
    })

    return NextResponse.json({ data: incident }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar incidente' }, { status: 500 })
  }
}
