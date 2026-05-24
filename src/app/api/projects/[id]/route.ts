import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { auditLog } from '@/lib/audit'
import { sendWebhook } from '@/lib/webhook-sender'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, image: true, company: true, email: true } },
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, image: true } },
          },
        },
        milestones: { orderBy: { order: 'asc' } },
        files: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { tasks: true, files: true, messages: true, comments: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    if (!isAdmin(user) && project.clientId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar projeto' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    const allowedFields = [
      'name', 'slug', 'description', 'status', 'priority', 'type',
      'progress', 'budget', 'deadline', 'tags', 'briefing',
      'completedSummary', 'completedLink', 'headerImage',
      'stepsData', 'cancelledReason', 'cancelledAt',
      'proposalMessage', 'proposalValue', 'isArchived',
      'contractSignedAt', 'completedAt',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) data[key] = body[key]
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    })

    if (body.budget !== undefined) {
      await prisma.projectBudgetHistory.create({
        data: {
          projectId: id,
          oldValue: body.oldBudget ?? null,
          newValue: body.budget,
          reason: body.budgetReason || null,
          changedBy: body.userId || 'system',
        },
      })
    }

    if (body.status === 'COMPLETED' && project.clientId) {
      await prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'NPS',
          title: 'Avalie seu projeto!',
          message: 'Leva menos de 1 minuto.',
          metadata: JSON.stringify({ url: `/portal/feedback/${project.id}` }),
        },
      })

      sendWebhook('project_completed', {
        id: project.id,
        name: project.name,
        clientId: project.clientId,
        completedAt: project.completedAt?.toISOString() || new Date().toISOString(),
      }).catch((err) => { console.error('[webhook]', err?.message || err) })
    }

    auditLog({
      userId: body.userId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: project.id,
      description: body.status ? `Status atualizado para ${body.status}` : 'Projeto atualizado',
    }).catch((err) => { console.error('[audit]', err?.message || err) })

    return NextResponse.json({ data: project })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.project.update({
      where: { id },
      data: { isArchived: true },
    })

    return NextResponse.json({ message: 'Projeto arquivado' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao arquivar projeto' }, { status: 500 })
  }
}
