import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { id } = await params
    const contract = await prisma.contract.findUnique({ where: { id }, include: { project: true } })
    if (!contract) return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 })
    if (contract.clientId !== user.id) return NextResponse.json({ error: 'Apenas o cliente pode enviar' }, { status: 403 })

    const body = await request.json()
    const { signedUrl, fileName } = body

    await prisma.contract.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        signatureUrl: signedUrl,
        signedAt: new Date(),
      },
    })

    if (contract.projectId) {
      await prisma.project.update({
        where: { id: contract.projectId },
        data: {
          status: 'IN_PROGRESS',
          contractSignedAt: new Date(),
          contractSignedUrl: signedUrl,
        },
      })
    }

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'CONTRACT',
          title: 'Contrato assinado enviado',
          message: `O cliente enviou o contrato assinado "${contract.title}".`,
          isRead: false,
        },
      })
    }

    return NextResponse.json({ message: 'Contrato assinado enviado com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao enviar contrato' }, { status: 500 })
  }
}
