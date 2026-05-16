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
    const body = await request.json()
    const { action } = body

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } })
    if (!project) return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })

    if (project.clientId !== token.id) {
      return NextResponse.json({ error: 'Apenas o cliente do projeto pode responder' }, { status: 403 })
    }

    if (action === 'accept') {
      await prisma.project.update({
        where: { id },
        data: { clientResponse: 'ACCEPTED', status: 'IN_PROGRESS' },
      })

      await prisma.notification.create({
        data: {
          userId: token.id as string,
          type: 'PROJECT_UPDATE',
          title: 'Proposta aceita!',
          message: `Voce aceitou a proposta do projeto "${project.name}". Agora assine o contrato para iniciarmos.`,
          metadata: JSON.stringify({ projectId: project.id }),
          isRead: false,
        },
      })

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PROJECT_UPDATE',
            title: `Cliente aceitou proposta`,
            message: `${project.client.name} aceitou a proposta do projeto "${project.name}".`,
            isRead: false,
          },
        })
      }

      const contract = await prisma.contract.create({
        data: {
          title: `Contrato - ${project.name}`,
          content: `Contrato de prestacao de servicos para o projeto "${project.name}". Valor: R$ ${project.proposalValue}.`,
          clientId: token.id as string,
          projectId: id,
          status: 'DRAFT',
          value: project.proposalValue || 0,
        },
      })

      return NextResponse.json({
        message: 'Proposta aceita! Agora assine o contrato.',
        contractId: contract.id,
      })
    }

    if (action === 'reject') {
      const now = new Date()
      await prisma.project.update({
        where: { id },
        data: {
          clientResponse: 'REJECTED',
          status: 'CANCELLED',
          cancelledReason: 'Recusado pelo cliente',
          cancelledAt: now,
        },
      })

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PROJECT_UPDATE',
            title: `Cliente recusou proposta`,
            message: `${project.client.name} recusou a proposta do projeto "${project.name}".`,
            isRead: false,
          },
        })
      }

      await prisma.activity.create({
        data: {
          type: 'CANCELLED',
          action: `Cancelado pelo cliente em ${now.toLocaleDateString('pt-BR')}`,
          details: 'Cliente recusou a proposta',
          userId: token.id as string,
          projectId: id,
        },
      })

      return NextResponse.json({ message: 'Proposta recusada. Projeto cancelado.' })
    }

    return NextResponse.json({ error: 'Acao invalida. Use accept ou reject.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao processar resposta' }, { status: 500 })
  }
}
