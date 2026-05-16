import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { id } = await params
    const message = await prisma.message.findUnique({ where: { id } })
    if (!message) return NextResponse.json({ error: 'Mensagem nao encontrada' }, { status: 404 })
    if (message.senderId !== user.id) return NextResponse.json({ error: 'Apenas o autor pode deletar' }, { status: 403 })

    await prisma.message.update({
      where: { id },
      data: { content: 'Mensagem apagada', type: 'deleted', isEdited: true },
    })

    return NextResponse.json({ message: 'Mensagem apagada' })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar mensagem' }, { status: 500 })
  }
}
