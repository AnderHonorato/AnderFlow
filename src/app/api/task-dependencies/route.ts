import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')

    if (taskId) {
      const deps = await prisma.taskDependency.findMany({
        where: { taskId },
        include: {
          dependsOn: { select: { id: true, title: true, status: true, priority: true } },
        },
      })
      return NextResponse.json({ data: deps })
    }

    if (projectId) {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dependencies: {
            select: {
              dependsOn: { select: { id: true, title: true, status: true, priority: true } },
            },
          },
        },
      })
      return NextResponse.json({ data: tasks })
    }

    return NextResponse.json({ error: 'taskId ou projectId obrigatorio' }, { status: 400 })
  } catch (error: any) {
    console.error('[task-dependencies GET]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      taskId: z.string().cuid(),
      dependsOnId: z.string().cuid(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.flatten() }, { status: 400 })

    const { taskId, dependsOnId } = parsed.data
    if (taskId === dependsOnId) {
      return NextResponse.json({ error: 'Uma tarefa nao pode depender de si mesma' }, { status: 400 })
    }

    const existing = await prisma.taskDependency.findUnique({
      where: { taskId_dependsOnId: { taskId, dependsOnId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Dependencia ja existe' }, { status: 409 })
    }

    const dep = await prisma.taskDependency.create({
      data: { taskId, dependsOnId },
      include: {
        dependsOn: { select: { id: true, title: true, status: true, priority: true } },
      },
    })

    return NextResponse.json({ data: dep }, { status: 201 })
  } catch (error: any) {
    console.error('[task-dependencies POST]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const dependsOnId = searchParams.get('dependsOnId')

    if (!taskId || !dependsOnId) {
      return NextResponse.json({ error: 'taskId e dependsOnId obrigatorios' }, { status: 400 })
    }

    await prisma.taskDependency.deleteMany({
      where: { taskId, dependsOnId },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    console.error('[task-dependencies DELETE]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
