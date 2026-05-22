import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, score, comment } = body

    if (!projectId || score === undefined) {
      return NextResponse.json({ error: 'projectId e score sao obrigatorios' }, { status: 400 })
    }

    if (score < 0 || score > 10) {
      return NextResponse.json({ error: 'Score deve ser entre 0 e 10' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })
    }

    await prisma.npsResponse.create({
      data: {
        projectId,
        clientId: project.clientId,
        score,
        comment: comment || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar NPS' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const responses = await prisma.npsResponse.findMany({
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const scores = responses.map((r: { score: number }) => r.score)
    const average = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '0'
    const promoters = scores.filter((s: number) => s >= 9).length
    const neutrals = scores.filter((s: number) => s >= 7 && s <= 8).length
    const detractors = scores.filter((s: number) => s <= 6).length
    const total = scores.length
    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0

    return NextResponse.json({
      data: responses,
      metrics: {
        average: parseFloat(average),
        npsScore,
        promoters,
        neutrals,
        detractors,
        total,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao buscar NPS' }, { status: 500 })
  }
}
