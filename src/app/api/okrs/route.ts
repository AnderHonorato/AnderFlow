import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  try {
    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId

    const okrs = await prisma.oKR.findMany({
      where,
      include: { keyResults: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: okrs })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar OKRs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { projectId, objective, keyResults } = body

    if (!projectId || !objective?.trim()) {
      return NextResponse.json({ error: 'projectId e objective são obrigatórios' }, { status: 400 })
    }

    const okr = await prisma.oKR.create({
      data: {
        projectId,
        objective: objective.trim(),
        keyResults: {
          create: (keyResults || []).map((kr: any) => ({
            title: kr.title,
            targetValue: kr.targetValue || 100,
            unit: kr.unit || '%',
          })),
        },
      },
      include: { keyResults: true },
    })

    return NextResponse.json({ data: okr }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar OKR' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { krId, currentValue } = body

    if (!krId) {
      return NextResponse.json({ error: 'krId é obrigatório' }, { status: 400 })
    }

    const kr = await prisma.keyResult.update({
      where: { id: krId },
      data: { currentValue },
    })

    return NextResponse.json({ data: kr })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar KR' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

    await prisma.keyResult.deleteMany({ where: { okrId: id } })
    await prisma.oKR.delete({ where: { id } })

    return NextResponse.json({ message: 'OKR removido' })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover OKR' }, { status: 500 })
  }
}
