import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const projects = await prisma.project.findMany({
      where: {
        clientId: user.id,
        status: { not: 'CANCELLED' },
        updatedAt: { gte: sixtyDaysAgo },
      },
      select: {
        id: true,
        name: true,
        progress: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const weeklyMap: Record<string, { totalProgress: number; count: number }> = {}

    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - (11 - i) * 7)
      const weekKey = getWeekKey(d)
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { totalProgress: 0, count: 0 }
      }
    }

    const snapshots: { projectId: string; progress: number; week: string }[] = []
    for (const p of projects) {
      snapshots.push({
        projectId: p.id,
        progress: p.progress || 0,
        week: getWeekKey(p.updatedAt),
      })
    }

    for (const snap of snapshots) {
      if (!weeklyMap[snap.week]) weeklyMap[snap.week] = { totalProgress: 0, count: 0 }
      weeklyMap[snap.week].totalProgress += snap.progress
      weeklyMap[snap.week].count++
    }

    const history = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
        projectCount: data.count,
      }))

    return NextResponse.json({ data: { history } })
  } catch (error: any) {
    console.error('[progress-history]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

function getWeekKey(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const week = Math.ceil(((monday.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
