import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  return (token?.id as string) || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ data: [] })

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    const messages = await prisma.message.findMany({
      where: channelId ? { channelId } : { id: 'never' },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ data: [], error: 'Erro ao buscar' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const data: any = {
      content: content.trim(),
      senderId: userId,
      type: body.type || 'text',
      channelId: body.channelId || null,
      projectId: body.projectId || null,
    }
    if (body.metadata) data.metadata = body.metadata

    const message = await prisma.message.create({
      data,
      include: { sender: { select: { id: true, name: true, role: true } } },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 200 })
  }
}
