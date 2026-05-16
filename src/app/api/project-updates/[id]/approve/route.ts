import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    const { id } = await params

    const update = await prisma.projectUpdate.findUnique({ where: { id }, include: { project: { select: { clientId: true, name: true } } } })
    if (!update) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    if (update.project?.clientId !== user.id) return NextResponse.json({ error: 'Apenas o cliente pode aprovar' }, { status: 403 })

    await prisma.projectUpdate.update({
      where: { id },
      data: { approvedAt: new Date(), approvedBy: user.id },
    })

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'APPROVAL',
          title: 'Update aprovado pelo cliente',
          message: `"${update.title}" foi aprovado no projeto "${update.project?.name}".`,
          isRead: false,
        },
      })
    }

    return NextResponse.json({ message: 'Aprovado com sucesso' })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}
