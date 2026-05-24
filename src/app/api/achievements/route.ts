import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.id) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { unlockedAt: 'desc' },
  })

  return NextResponse.json({ data: achievements })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.id || !isAdmin(user)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { userId, type, projectId } = body

  if (!userId || !type) {
    return NextResponse.json({ error: 'userId e type obrigatorios' }, { status: 400 })
  }

  const where: any = { userId, type }
  if (projectId) where.projectId = projectId

  const existing = await prisma.achievement.findFirst({ where })
  if (existing) {
    return NextResponse.json({ data: existing, message: 'Conquista ja existe' })
  }

  const achievement = await prisma.achievement.create({
    data: { userId, type, projectId: projectId || null },
  })

  return NextResponse.json({ data: achievement }, { status: 201 })
}
