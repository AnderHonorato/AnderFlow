import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, confirmation } = body

    if (action === 'request_delete') {
      if (confirmation !== 'confirmo') {
        return NextResponse.json({ error: 'Digite "confirmo" para prosseguir' }, { status: 400 })
      }

      const deleteDate = new Date()
      deleteDate.setDate(deleteDate.getDate() + 7)

      await prisma.user.update({
        where: { id: token.id as string },
        data: {
          deleteRequestedAt: new Date(),
          deleteScheduledAt: deleteDate,
          isActive: false,
        },
      })

      await prisma.notification.create({
        data: {
          userId: token.id as string,
          type: 'ACCOUNT_UPDATE',
          title: 'Solicitacao de exclusao de conta',
          message: `Sua conta foi desativada e sera permanentemente excluida em ${deleteDate.toLocaleDateString('pt-BR')}. Um administrador pode reverter esta acao ate la.`,
          isRead: false,
        },
      })

      return NextResponse.json({
        message: `Conta desativada. Sera excluida permanentemente em ${deleteDate.toLocaleDateString('pt-BR')}. Um administrador pode reverter.`,
        deleteScheduledAt: deleteDate.toISOString(),
      })
    }

    return NextResponse.json({ error: 'Acao invalida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar solicitacao' }, { status: 500 })
  }
}
