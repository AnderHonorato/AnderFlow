import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { proposalMessage, proposalValue } = body

    if (!proposalMessage || !proposalValue) {
      return NextResponse.json({ error: 'Mensagem e valor da proposta obrigatorios' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'REVIEW',
        proposalMessage,
        proposalValue: parseFloat(proposalValue),
      },
      include: { client: { select: { id: true, name: true } } },
    })

    await prisma.notification.create({
      data: {
        userId: project.clientId,
        type: 'APPROVAL',
        title: 'Proposta enviada para seu projeto',
        message: `O administrador enviou uma proposta de R$ ${proposalValue} para o projeto "${project.name}". Acesse para aceitar ou recusar.`,
        metadata: JSON.stringify({ projectId: project.id }),
        isRead: false,
      },
    })

    await prisma.activity.create({
      data: {
        type: 'APPROVAL',
        action: 'Proposta enviada ao cliente',
        details: `Valor: R$ ${proposalValue}. Mensagem: ${proposalMessage.slice(0, 200)}`,
        userId: token.id as string,
        projectId: id,
      },
    })

    return NextResponse.json({ data: project, message: 'Proposta enviada ao cliente' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao aprovar' }, { status: 500 })
  }
}
