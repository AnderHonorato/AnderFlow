import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json()
    const { messageContent, liked, feedback, errorReport, screenshot } = body

    // Store in the existing Feedback model
    await prisma.feedback.create({
      data: {
        userId: user.id,
        type: errorReport ? 'ai_error' : 'ai_feedback',
        title: liked ? 'Feedback positivo IA' : errorReport ? 'Erro reportado IA' : 'Feedback negativo IA',
        content: `Usuario: ${user.name || 'N/A'}\nMensagem IA: ${(messageContent || '').slice(0, 500)}\nFeedback: ${feedback || 'Sem texto'}\n${screenshot ? 'Screenshot: Sim' : 'Screenshot: Nao'}`,
        rating: liked ? 5 : 1,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Feedback save error:', e)
    return NextResponse.json({ error: 'Erro ao salvar feedback' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json({ data: feedbacks })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
