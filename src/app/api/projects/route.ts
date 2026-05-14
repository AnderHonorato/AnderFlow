import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { isArchived: false }
    if (status) where.status = status
    if (!isAdmin(user)) where.clientId = user.id

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, image: true, company: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({ data: projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, type, budget, deadline, priority, briefing, tags } = body

    const clientId = body.clientId || user.id

    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const project = await prisma.project.create({
      data: {
        name, slug, description,
        type: type || 'CUSTOM',
        clientId,
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'MEDIUM',
        briefing: briefing ? JSON.stringify(briefing) : null,
        tags: JSON.stringify(tags || []),
      },
      include: { client: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar projeto' }, { status: 500 })
  }
}
