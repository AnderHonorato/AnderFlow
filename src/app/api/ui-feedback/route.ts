import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      page: z.string().min(1),
      helpful: z.boolean(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

    await prisma.uiFeedback.create({
      data: { page: parsed.data.page, helpful: parsed.data.helpful, userId: user.id },
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const feedbacks = await prisma.uiFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const byPage = new Map<string, { positive: number; negative: number }>()
    feedbacks.forEach(f => {
      const entry = byPage.get(f.page) || { positive: 0, negative: 0 }
      if (f.helpful) entry.positive++
      else entry.negative++
      byPage.set(f.page, entry)
    })

    const pages = Array.from(byPage.entries()).map(([page, counts]) => ({
      page,
      positive: counts.positive,
      negative: counts.negative,
      total: counts.positive + counts.negative,
      positivePercent: counts.positive + counts.negative > 0
        ? Math.round((counts.positive / (counts.positive + counts.negative)) * 100)
        : 0,
    })).sort((a, b) => a.positivePercent - b.positivePercent)

    return NextResponse.json({ data: { pages, total: feedbacks.length } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
