import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import { cargoParaNivel } from '@/lib/hierarquia'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || cargoParaNivel(token.role as string) < 40) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (botId) where.botId = botId
    if (status) where.status = status

    const [actions, total] = await Promise.all([
      (prisma as any).botActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (prisma as any).botActionLog.count({ where }),
    ])

    return NextResponse.json({
      data: (actions || []).map((a: any) => ({
        id: a.id,
        botId: a.botId,
        botName: a.botName,
        botRole: a.botRole,
        action: a.action,
        endpoint: a.endpoint,
        method: a.method,
        status: a.status,
        result: a.result?.slice(0, 120),
        error: a.error?.slice(0, 120),
        tokensUsed: a.tokensUsed,
        costEstimate: a.costEstimate,
        createdAt: a.createdAt,
      })),
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro', data: [], total: 0 }, { status: 500 })
  }
}
