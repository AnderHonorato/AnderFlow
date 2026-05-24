import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const usages = await prisma.apiKeyUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 86400000)

    const byKey: Record<string, { today: number; week: number; lastRequest: any; hourly: Record<string, number> }> = {}

    for (const u of usages) {
      if (!byKey[u.keyId]) {
        byKey[u.keyId] = { today: 0, week: 0, lastRequest: null, hourly: {} }
      }
      const entry = byKey[u.keyId]
      if (new Date(u.createdAt) >= todayStart) entry.today++
      if (new Date(u.createdAt) >= weekStart) entry.week++
      if (!entry.lastRequest || new Date(u.createdAt) > new Date(entry.lastRequest.createdAt)) {
        entry.lastRequest = u
      }
      const hour = new Date(u.createdAt).toISOString().slice(0, 13)
      entry.hourly[hour] = (entry.hourly[hour] || 0) + 1
    }

    return NextResponse.json({ data: byKey })
  } catch {
    return NextResponse.json({ data: {} })
  }
}
