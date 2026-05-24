import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const original = await prisma.project.findUnique({
    where: { id: params.id },
    include: { tasks: true, milestones: true },
  })

  if (!original) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  const { name, clientId, copyTasks, copyMilestones } = await req.json()

  if (!name || !clientId) {
    return NextResponse.json({ error: 'Nome e cliente são obrigatórios' }, { status: 400 })
  }

  const client = await prisma.user.findUnique({ where: { id: clientId } })
  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const slug = generateSlug(name) + '-' + Date.now().toString(36)

  const newProject = await prisma.project.create({
    data: {
      name,
      slug,
      description: original.description,
      type: original.type,
      status: 'DRAFT',
      priority: original.priority,
      budget: original.budget,
      estimatedHours: original.estimatedHours,
      startDate: original.startDate,
      endDate: original.endDate,
      deadline: original.deadline,
      clientId,
      stepsData: original.stepsData,
      tags: original.tags,
      briefing: original.briefing,
    },
  })

  if (copyMilestones && original.milestones.length > 0) {
    await prisma.milestone.createMany({
      data: original.milestones.map(m => ({
        name: m.name,
        description: m.description,
        dueDate: m.dueDate,
        projectId: newProject.id,
        order: m.order,
      })),
    })
  }

  if (copyTasks && original.tasks.length > 0) {
    await prisma.task.createMany({
      data: original.tasks.map(t => ({
        title: t.title,
        description: t.description,
        status: 'TODO',
        priority: t.priority,
        projectId: newProject.id,
        order: t.order,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        tags: t.tags,
        creatorId: user.id,
      })),
    })
  }

  return NextResponse.json({ data: newProject }, { status: 201 })
}
