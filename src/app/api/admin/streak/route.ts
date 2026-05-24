import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
        action: { in: ['UPDATE', 'CREATE'] },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const daySet = new Set<string>()
    recentAuditLogs.forEach(log => {
      const d = new Date(log.createdAt)
      daySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    })

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (daySet.has(key)) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
      } else {
        if (i === 0) { tempStreak = 0; continue }
        if (i === 1 || currentStreak === 0) currentStreak = tempStreak
        tempStreak = 0
      }
    }

    if (currentStreak === 0 && daySet.has(todayStr)) currentStreak = 1
    if (currentStreak === 0 && tempStreak > 0) currentStreak = tempStreak

    const today = daySet.has(todayStr)

    const last7Days: boolean[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      last7Days.push(daySet.has(key))
    }

    return NextResponse.json({
      data: { currentStreak, longestStreak, today, last7Days },
    })
  } catch (error: any) {
    console.error('[admin/streak]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
