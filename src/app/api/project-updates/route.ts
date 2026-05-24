import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { chat } from '@/lib/deepseek'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) return NextResponse.json({ data: [] })

    const updates = await prisma.projectUpdate.findMany({
      where: { projectId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: updates })
  } catch { return NextResponse.json({ data: [], error: 'Erro' }, { status: 200 }) }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })

    const body = await request.json()
    const { projectId, title, description, type, beforeImage, afterImage, requiresApproval } = body

    if (!projectId || !title) return NextResponse.json({ error: 'Campos obrigatorios' }, { status: 400 })

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        title,
        description: description || '',
        type: type || 'FEATURE',
        beforeImage: beforeImage || null,
        afterImage: afterImage || null,
        authorId: user.id,
        requiresApproval: requiresApproval || false,
      },
      include: { author: { select: { id: true, name: true } } },
    })

    if (update.description) {
      try {
        const result = await chat([
          {
            role: 'user',
            content: `Analise o sentimento deste texto de cliente. Responda APENAS com JSON:
{ "sentiment": "positive"|"neutral"|"negative", "score": 0.0-1.0, "keywords": ["palavra1", "palavra2"] }

Texto: "${update.description}"`,
          },
        ], { maxTokens: 150, temperature: 0.3 })

        const parsed = JSON.parse(result.content)
        const metadata = {
          sentiment: parsed.sentiment || 'neutral',
          score: parsed.score || 0.5,
          keywords: parsed.keywords || [],
        }

        await prisma.projectUpdate.update({
          where: { id: update.id },
          data: { metadata },
        })
      } catch { /* sentiment analysis failure doesn't block the main flow */ }
    }

    if (requiresApproval) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true, name: true } })
      if (project) {
        await prisma.notification.create({
          data: {
            userId: project.clientId,
            type: 'APPROVAL',
            title: 'Nova atualizacao para aprovacao',
            message: `"${title}" no projeto "${project.name}" aguarda sua aprovacao.`,
            metadata: JSON.stringify({ projectId }),
            isRead: false,
          },
        })
      }
    }

    return NextResponse.json({ data: update }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}
