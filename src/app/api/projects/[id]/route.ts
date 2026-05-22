import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
