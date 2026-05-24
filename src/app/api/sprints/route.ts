import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { z } from 'zod'

const createSprintSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  goal: z.string().max(500).optional(),
  projectId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (projectId) where.projectId = projectId

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ data: sprints })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao buscar sprints' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createSprintSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, goal, projectId, startDate, endDate } = parsed.data

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal: goal || '',
        projectId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: sprint }, { status: 201 })
  } catch (error: any) {
    console.error('[sprints:POST]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar sprint' }, { status: 500 })
  }
}
