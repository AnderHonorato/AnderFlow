import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return unauthorizedResponse()

  const { id } = await params
  const fourMonthsAgo = new Date()
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)

  const [project, npsResponses, checkins, tickets, tasks] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, clientId: true },
    }),
    prisma.npsResponse.aggregate({
      where: { projectId: id },
      _avg: { score: true },
      _count: true,
    }),
    prisma.weeklyCheckin.findMany({
      where: { projectId: id, createdAt: { gte: fourMonthsAgo } },
      select: { mood: true },
    }),
    prisma.ticket.findMany({
      where: { metadata: { contains: id } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.task.findMany({
      where: { projectId: id, dueDate: { not: null }, completedAt: { not: null } },
      select: { dueDate: true, completedAt: true },
    }),
  ])

  if (!project) {
    return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })
  }

  // NPS score (0-100): average score * 10
  const npsAvg = npsResponses._avg.score || 0
  const npsScore = Math.min(npsAvg * 10, 100)

  // Checkins: mood average * 20 (mood is 1-5 scale)
  const checkinAvg = checkins.length > 0
    ? checkins.reduce((s, c) => s + c.mood, 0) / checkins.length
    : 3
  const checkinScore = checkinAvg * 20

  // SLA tickets: average response time score
  let slaScore = 50
  if (tickets.length > 0) {
    let totalHours = 0
    let count = 0
    tickets.forEach(t => {
      if (t.resolvedAt) {
        totalHours += (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000
        count++
      }
    })
    const avgHours = count > 0 ? totalHours / count : 72
    // Score based on response time: <2h = 100, <8h = 80, <24h = 60, <48h = 40, >48h = 20
    slaScore = avgHours < 2 ? 100 : avgHours < 8 ? 80 : avgHours < 24 ? 60 : avgHours < 48 ? 40 : 20
  }

  // On-time delivery rate
  let onTimeScore = 50
  if (tasks.length > 0) {
    const onTime = tasks.filter(t => t.dueDate && t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate!))
    onTimeScore = (onTime.length / tasks.length) * 100
  }

  // Weighted score: NPS 40%, Checkins 30%, SLA 20%, On-time 10%
  const score = Math.round(
    npsScore * 0.4 + checkinScore * 0.3 + slaScore * 0.2 + onTimeScore * 0.1
  )

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D'

  // Determine trend (compare with previous calculation from stepsData)
  const trend = score >= 70 ? 'up' : score >= 50 ? 'stable' : 'down'

  const breakdown = {
    nps: { score: Math.round(npsScore), weight: 40, responses: npsResponses._count || 0 },
    checkins: { score: Math.round(checkinScore), weight: 30, count: checkins.length },
    sla: { score: Math.round(slaScore), weight: 20, tickets: tickets.length },
    onTime: { score: Math.round(onTimeScore), weight: 10, tasks: tasks.length },
  }

  let recommendation = ''
  if (slaScore < 60) recommendation = 'Para melhorar, foque em responder tickets mais rapidamente'
  else if (onTimeScore < 60) recommendation = 'Para melhorar, priorize entregas dentro do prazo'
  else if (npsScore < 50) recommendation = 'Para melhorar, investigue a satisfacao do cliente com mais check-ins'
  else recommendation = 'O projeto esta com boa saude. Continue o bom trabalho!'

  return NextResponse.json({
    data: { score, grade, breakdown, trend, recommendation },
  })
}
