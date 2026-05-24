import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { stepId, approved, comment } = body

    if (stepId === undefined || approved === undefined) {
      return NextResponse.json({ error: 'stepId e approved são obrigatórios' }, { status: 400 })
    }

    const fb = await prisma.taskFeedback.create({
      data: {
        projectId,
        stepId,
        clientId: user.id,
        approved,
        comment: comment || null,
      },
    })

    if (!approved) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PROJECT_UPDATE',
            title: 'Ajuste solicitado pelo cliente',
            message: `O cliente solicitou ajuste no step ${stepId} do projeto "${project?.name || 'N/A'}".${comment ? ' Comentário: ' + comment : ''}`,
            metadata: JSON.stringify({ projectId, stepId }),
          },
        })
      }
    }

    return NextResponse.json({ data: fb })
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar feedback' }, { status: 500 })
  }
}
