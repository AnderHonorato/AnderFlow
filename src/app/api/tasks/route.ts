import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        subtasks: { select: { id: true, title: true, status: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ data: tasks })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, projectId, assigneeId, creatorId, priority, dueDate, parentId, milestoneId, sprintId } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId,
        creatorId,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        parentId,
        milestoneId,
        sprintId,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}
