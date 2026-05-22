import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const bots = await prisma.user.findMany({
      where: { isBot: true, botStatus: 'ACTIVE', isActive: true },
      select: { id: true, name: true, email: true, role: true, botContext: true, botLastActionAt: true },
    })

    const results = []
    for (const bot of bots) {
      try {
        const { processBotStep } = await import('@/lib/bots/motor')
        await processBotStep(bot)
        results.push({ id: bot.id, name: bot.name, ok: true })
      } catch (e: any) {
        results.push({ id: bot.id, name: bot.name, ok: false, error: e?.message })
      }
    }

    return NextResponse.json({ data: results, processed: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
