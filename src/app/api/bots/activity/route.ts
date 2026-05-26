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

    // Busca ações recentes do BotActionLog para cada bot
    const botIds = bots.map(b => b.id)
    const recentLogs = await (prisma as any).botActionLog.findMany({
      where: { botId: { in: botIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(() => [])

    const logsByBot: Record<string, any[]> = {}
    for (const log of (recentLogs || [])) {
      if (!logsByBot[log.botId]) logsByBot[log.botId] = []
      if (logsByBot[log.botId].length < 10) {
        logsByBot[log.botId].push(log)
      }
    }

    const reports: {
      botName: string
      botId: string
      role: string
      status: string | null
      lastActionAt: string | null
      recentActions: {
        id?: string
        time: string
        action: string
        result?: string
        error?: string
        status?: string
        tokensUsed?: number
        costEstimate?: number
      }[]
    }[] = []

    for (const bot of bots) {
      // Prioriza ações do BotActionLog (persistente), fallback para botContext
      const dbLogs = logsByBot[bot.id] || []
      let actions: any[]
      let hasDbActions = false

      if (dbLogs.length > 0) {
        hasDbActions = true
        actions = dbLogs.map((l: any) => ({
          id: l.id,
          time: l.createdAt,
          action: l.action,
          result: l.result?.slice(0, 120),
          error: l.error?.slice(0, 120),
          status: l.status,
          tokensUsed: l.tokensUsed,
          costEstimate: l.costEstimate,
        }))
      } else if (bot.botContext) {
        try {
          const ctx = JSON.parse(bot.botContext)
          actions = (ctx.actions || []).slice(-10).reverse()
        } catch {
          actions = []
        }
      } else {
        actions = []
      }

      reports.push({
        botName: bot.name,
        botId: bot.id,
        role: bot.role,
        status: bot.botStatus,
        lastActionAt: dbLogs[0]?.createdAt || bot.botLastActionAt?.toISOString() || null,
        recentActions: actions.map((a: any) => ({
          id: a.id || undefined,
          time: a.time,
          action: a.action,
          result: a.result?.slice(0, 120) || a.error?.slice(0, 120) || undefined,
          error: a.error?.slice(0, 120) || undefined,
          status: a.status || undefined,
          tokensUsed: a.tokensUsed || undefined,
          costEstimate: a.costEstimate || undefined,
        })),
      })

      // Remove bots que nunca tiveram ações
      if (!hasDbActions && reports[reports.length - 1].recentActions.length === 0) {
        reports.pop()
      }
    }

    return NextResponse.json({ data: reports })
  } catch (error) {
    return NextResponse.json({ data: [], error: 'Erro ao buscar atividade' }, { status: 500 })
  }
}
