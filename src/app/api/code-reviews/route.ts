import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const reviews = await prisma.codeReview.findMany({
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: reviews })
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, title, description, codeSnippet, language } = body

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId e title sao obrigatorios' }, { status: 400 })
    }

    const review = await prisma.codeReview.create({
      data: {
        projectId,
        title,
        description: description || null,
        codeSnippet: codeSnippet || null,
        language: language || 'javascript',
        authorId: user.id,
      },
      include: { comments: true },
    })

    return NextResponse.json({ data: review }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar review' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    const review = await prisma.codeReview.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ data: review })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar review' }, { status: 500 })
  }
}
