import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const conversation = await prisma.aiConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!conversation) return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
    if (conversation.userId !== user.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })

    return NextResponse.json({
      data: {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    })
  } catch (e) {
    console.error('[AI conversation GET]', e)
    return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const conversation = await prisma.aiConversation.findUnique({ where: { id } })
    if (!conversation) return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
    if (conversation.userId !== user.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })

    await prisma.aiConversation.delete({ where: { id } })

    return NextResponse.json({ message: 'Conversa apagada' })
  } catch (e) {
    console.error('[AI conversation DELETE]', e)
    return NextResponse.json({ error: 'Erro ao apagar conversa' }, { status: 500 })
  }
}
