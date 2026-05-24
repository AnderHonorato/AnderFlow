import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jose from 'jose'

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const activeProjects = await prisma.project.findMany({
      where: {
        isArchived: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: { id: true, clientId: true, name: true },
    })

    const clientsWithProjects = [...new Set(activeProjects.map(p => p.clientId).filter(Boolean))]
    const week = getWeekNumber(new Date())
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')

    let sent = 0

    for (const clientId of clientsWithProjects) {
      const clientProjects = activeProjects.filter(p => p.clientId === clientId)

      const existing = await prisma.weeklyCheckin.findFirst({
        where: { clientId, week },
      })

      if (existing) continue

      const now = new Date()
      const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const jwt = await new jose.SignJWT({ clientId, week })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(exp.getTime() / 1000))
        .sign(secret)

      await prisma.notification.create({
        data: {
          userId: clientId,
          type: 'SYSTEM',
          title: 'Check-in semanal de satisfação',
          message: 'Como você se sente em relação ao andamento dos seus projetos esta semana? Leva 5 segundos!',
          metadata: JSON.stringify({
            url: `/portal/checkin/${jwt}`,
            projectId: clientProjects[0]?.id,
            week,
          }),
        },
      })

      sent++
    }

    return NextResponse.json({ sent, week, clients: clientsWithProjects.length })
  } catch (error: any) {
    console.error('[cron:weekly-checkin]', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
