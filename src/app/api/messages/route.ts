import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  return (token?.id as string) || null
}

async function canAccessChannel(channelId: string, userId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { clientId: true } })
  if (!channel) return false
  if (!channel.clientId) return true
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'DEVELOPER'
  return isAdminUser || channel.clientId === userId
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'channelId obrigatorio' }, { status: 400 })
    }

    if (!(await canAccessChannel(channelId, userId))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
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

    if (body.channelId && !(await canAccessChannel(body.channelId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao canal' }, { status: 403 })
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
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
