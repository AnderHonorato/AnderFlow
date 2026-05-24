import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.goal !== undefined) data.goal = body.goal
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate) data.endDate = new Date(body.endDate)

    const sprint = await prisma.sprint.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    })

    return NextResponse.json({ data: sprint })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar sprint' }, { status: 500 })
  }
}
