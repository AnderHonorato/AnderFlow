import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/autenticacao/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            sessions: true,
            messages: true,
          },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json({ erro: 'Usuario nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      dados: {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
        foto: usuario.image,
        funcao: usuario.role,
        criadoEm: usuario.createdAt,
        atualizadoEm: usuario.updatedAt,
        totalProjetos: usuario._count.projects,
        totalSessoes: usuario._count.sessions,
        totalMensagens: usuario._count.messages,
      },
    })
  } catch (erro: any) {
    return NextResponse.json({ erro: erro.message }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 })
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        deleteRequestedAt: new Date(),
        deleteScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      mensagem: 'Solicitacao de exclusao registrada. Sua conta sera excluida permanentemente em 7 dias. Um administrador pode reverter esta acao ate la.',
    })
  } catch (erro: any) {
    return NextResponse.json({ erro: erro.message }, { status: 500 })
  }
}
