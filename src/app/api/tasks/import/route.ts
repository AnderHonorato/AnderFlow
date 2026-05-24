import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { projectId, tasks } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 })
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Lista de tarefas é obrigatória' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const created = await prisma.task.createMany({
      data: tasks.map((t: any) => ({
        title: t.title,
        description: t.description || '',
        projectId,
        dueDate: t.deadline ? new Date(t.deadline) : null,
        creatorId: user.id,
      })),
    })

    return NextResponse.json({ created: created.count }, { status: 201 })
  } catch (error) {
    console.error('[tasks:import]', error)
    return NextResponse.json({ error: 'Erro ao importar tarefas' }, { status: 500 })
  }
}
