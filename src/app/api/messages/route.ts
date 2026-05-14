import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    return (token?.id as string) || null
  } catch {
    // Fallback: tenta primeiro cliente do banco para dev
    const firstClient = await prisma.user.findFirst({ where: { role: 'CLIENT' }, select: { id: true } })
    return firstClient?.id || null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ data: [] })

    const messages = await prisma.message.findMany({
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
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const message = await prisma.message.create({
      data: { content: content.trim(), senderId: userId, type: 'text' },
      include: { sender: { select: { id: true, name: true, role: true } } },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 200 })
  }
}
