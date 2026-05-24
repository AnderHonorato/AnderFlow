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
    const bots = await prisma.user.findMany({
      where: { isBot: true },
      select: { id: true, name: true, role: true, botStatus: true, botContext: true, botLastActionAt: true },
      orderBy: { botLastActionAt: 'desc' },
    })

    const reports: {
      botName: string
      botId: string
      role: string
      status: string | null
      lastActionAt: string | null
      recentActions: { time: string; action: string; result?: string }[]
    }[] = []

    for (const bot of bots) {
      let actions: any[] = []
      if (bot.botContext) {
        try {
          const ctx = JSON.parse(bot.botContext)
          actions = (ctx.actions || []).slice(-10).reverse()
        } catch {}
      }

      reports.push({
        botName: bot.name,
        botId: bot.id,
        role: bot.role,
        status: bot.botStatus,
        lastActionAt: bot.botLastActionAt?.toISOString() || null,
        recentActions: actions.map((a: any) => ({
          time: a.time,
          action: a.action,
          result: a.result?.slice(0, 120) || a.error?.slice(0, 120) || undefined,
        })),
      })
    }

    return NextResponse.json({ data: reports })
  } catch (error) {
    return NextResponse.json({ data: [], error: 'Erro ao buscar atividade' }, { status: 500 })
  }
}
