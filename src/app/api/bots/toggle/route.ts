import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner } from '@/lib/auth-utils'
import { startBotEngine, stopBotEngine } from '@/lib/bots/motor'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Apenas Owner pode gerenciar bots' }, { status: 403 })
    }

    const { userId, action } = await request.json()
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId e action obrigatorios' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target || !target.isBot) {
      return NextResponse.json({ error: 'Usuario nao e um bot' }, { status: 400 })
    }

    if (action === 'activate') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          botStatus: 'ACTIVE',
          botContext: JSON.stringify({ startedAt: new Date().toISOString(), actions: [], pendingDependency: null, state: {} }),
          botLastActionAt: null,
        },
      })
      startBotEngine()
      return NextResponse.json({ ok: true, status: 'ACTIVE' })
    }

    if (action === 'deactivate') {
      await prisma.user.update({
        where: { id: userId },
        data: { botStatus: 'IDLE', botContext: null },
      })

      const anyActive = await prisma.user.findFirst({ where: { isBot: true, botStatus: 'ACTIVE' } })
      if (!anyActive) stopBotEngine()

      return NextResponse.json({ ok: true, status: 'IDLE' })
    }

    return NextResponse.json({ error: 'action invalida. Use activate ou deactivate.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
