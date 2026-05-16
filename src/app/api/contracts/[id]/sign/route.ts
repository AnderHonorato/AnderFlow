import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const contract = await prisma.contract.findUnique({ where: { id }, include: { project: true } })
    if (!contract) return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 })

    if (contract.clientId !== token.id) {
      return NextResponse.json({ error: 'Apenas o cliente pode assinar' }, { status: 403 })
    }

    const body = await request.json()
    const { signatureUrl } = body

    await prisma.contract.update({
      where: { id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signatureUrl: signatureUrl || null,
      },
    })

    if (contract.projectId && contract.project) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'CONTRACT',
            title: 'Contrato assinado',
            message: `O contrato do projeto "${contract.project?.name || 'Projeto'}" foi assinado pelo cliente.`,
            isRead: false,
          },
        })
      }
    }

    return NextResponse.json({ message: 'Contrato assinado com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao assinar' }, { status: 500 })
  }
}
