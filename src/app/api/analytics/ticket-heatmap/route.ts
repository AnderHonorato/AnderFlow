import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { createdAt: true },
    })

    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    let total = 0
    let maxCount = 0

    tickets.forEach(t => {
      const d = new Date(t.createdAt)
      const day = d.getDay()
      const hour = d.getHours()
      heatmap[day][hour]++
      total++
      if (heatmap[day][hour] > maxCount) maxCount = heatmap[day][hour]
    })

    let peakDay = 0
    let peakHour = 0
    let peakValue = 0
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (heatmap[d][h] > peakValue) {
          peakValue = heatmap[d][h]
          peakDay = d
          peakHour = h
        }
      }
    }

    return NextResponse.json({
      data: {
        heatmap,
        maxCount,
        total,
        peak: { day: peakDay, hour: peakHour, count: peakValue },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
