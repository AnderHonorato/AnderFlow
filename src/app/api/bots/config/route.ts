import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner } from '@/lib/auth-utils'
import { getBotConfig, startBotEngine, stopBotEngine } from '@/lib/bots/motor'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Apenas Owner pode ver config de bots' }, { status: 403 })
    }

    const config = await getBotConfig()

    const bots = await prisma.user.findMany({
      where: { isBot: true },
      select: { id: true, name: true, email: true, role: true, botStatus: true, isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      data: {
        intervalMs: config.intervalMs,
        bots: bots.map(b => ({
          id: b.id,
          name: b.name,
          email: b.email,
          role: b.role,
          botStatus: b.botStatus,
          isActive: b.isActive,
        })),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Apenas Owner pode alterar config de bots' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { intervalMs, activeBotIds } = body

    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER', isBot: false, isActive: true },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner nao encontrado' }, { status: 400 })
    }

    const pref = await prisma.userPreference.findFirst({ where: { userId: owner.id } })
    const currentPrefs = (pref?.preferences || {}) as Record<string, any>

    const updatedPrefs = { ...currentPrefs }

    if (typeof intervalMs === 'number' && intervalMs >= 5000 && intervalMs <= 120000) {
      updatedPrefs.botIntervalMs = intervalMs
    }

    if (Array.isArray(activeBotIds)) {
      updatedPrefs.botActiveIds = activeBotIds
    }

    await prisma.userPreference.upsert({
      where: { userId: owner.id },
      create: {
        userId: owner.id,
        preferences: updatedPrefs,
      },
      update: {
        preferences: updatedPrefs,
      },
    })

    const hasActiveBots = await prisma.user.findFirst({ where: { isBot: true, botStatus: 'ACTIVE', isActive: true } })
    if (hasActiveBots) {
      startBotEngine(updatedPrefs.botIntervalMs || 10000)
    } else {
      stopBotEngine()
    }

    return NextResponse.json({ ok: true, config: { intervalMs: updatedPrefs.botIntervalMs, activeBotIds: updatedPrefs.botActiveIds } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}
