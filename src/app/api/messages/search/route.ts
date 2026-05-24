import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const channelId = searchParams.get('channelId')

    if (!q || !channelId) {
      return NextResponse.json({ error: 'q e channelId são obrigatórios' }, { status: 400 })
    }

    const results = await prisma.message.findMany({
      where: {
        channelId,
        content: { contains: q, mode: 'insensitive' },
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ data: { results } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao buscar mensagens' }, { status: 500 })
  }
}
