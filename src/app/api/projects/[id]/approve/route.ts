import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BRIEFING_SECTIONS } from '@/lib/briefing-template'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({ where: { id: params.id } })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    if (project.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Projeto já foi aprovado' }, { status: 400 })
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: 'TODO',
        briefing: JSON.stringify(BRIEFING_SECTIONS),
      },
      include: { client: { select: { id: true, name: true } } },
    })

    await prisma.notification.create({
      data: {
        userId: project.clientId,
        type: 'PROJECT_UPDATE',
        title: 'Projeto aprovado — Preencha o briefing',
        message: `Seu projeto "${project.name}" foi aprovado! Clique aqui para preencher o briefing e começarmos.`,
        isRead: false,
        metadata: JSON.stringify({ projectId: params.id, action: 'fill_briefing' }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao aprovar projeto' }, { status: 500 })
  }
}
