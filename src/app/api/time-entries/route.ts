import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, projectId, action } = body

    if (!taskId || !action) {
      return NextResponse.json({ error: 'taskId e action sao obrigatorios' }, { status: 400 })
    }

    let resolvedProjectId = projectId
    if (!resolvedProjectId) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
      if (task) resolvedProjectId = task.projectId
    }

    if (!resolvedProjectId) {
      return NextResponse.json({ error: 'projectId nao encontrado' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } })
    if (!task) return NextResponse.json({ error: 'Task nao encontrada' }, { status: 404 })

    const project = await prisma.project.findUnique({ where: { id: resolvedProjectId }, select: { id: true } })
    if (!project) return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })

    if (action === 'start') {
      const existing = await prisma.timeEntry.findFirst({
        where: { taskId, userId: user.id, endAt: null },
        orderBy: { createdAt: 'desc' },
      })

      if (existing) {
        return NextResponse.json({ data: existing, message: 'Timer ja esta rodando' })
      }

      const entry = await prisma.timeEntry.create({
        data: {
          userId: user.id,
          projectId: resolvedProjectId,
          taskId,
          startAt: new Date(),
        },
      })

      return NextResponse.json({ data: entry })
    }

    if (action === 'stop') {
      const entry = await prisma.timeEntry.findFirst({
        where: { taskId, userId: user.id, endAt: null },
        orderBy: { createdAt: 'desc' },
      })

      if (!entry) {
        return NextResponse.json({ error: 'Nenhum timer ativo encontrado' }, { status: 404 })
      }

      const endAt = new Date()
      const duration = Math.round((endAt.getTime() - entry.startAt!.getTime()) / 1000)

      const updated = await prisma.timeEntry.update({
        where: { id: entry.id },
        data: { endAt, duration },
      })

      return NextResponse.json({ data: updated })
    }

    return NextResponse.json({ error: 'action invalida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao processar' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')

    const where: any = { userId: user.id }
    if (taskId) where.taskId = taskId
    if (projectId) where.projectId = projectId

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0)

    return NextResponse.json({ data: entries, totalDuration: totalSeconds })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao buscar' }, { status: 500 })
  }
}
