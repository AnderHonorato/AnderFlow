import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const now = new Date()
  const alerts: { days: number; emoji: string; prefix: string }[] = [
    { days: 7, emoji: '📅', prefix: 'Estamos no caminho certo! 🚀' },
    { days: 3, emoji: '⚠️', prefix: 'Em caso de duvidas, fale conosco.' },
    { days: 1, emoji: '🔔', prefix: 'Temos tudo preparado para voce.' },
  ]

  let sent = 0
  let skipped = 0

  for (const alert of alerts) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + alert.days)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const projects = await prisma.project.findMany({
      where: {
        deadline: { gte: startOfDay, lte: endOfDay },
        isArchived: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: { id: true, name: true, deadline: true, clientId: true },
    })

    for (const project of projects) {
      const existing = await prisma.deadlineAlert.findUnique({
        where: { projectId_type: { projectId: project.id, type: `deadline_${alert.days}d` } },
      })
      if (existing) { skipped++; continue }

      const client = await prisma.user.findUnique({
        where: { id: project.clientId },
        select: { phone: true, name: true },
      })

      if (!client?.phone) { skipped++; continue }

      const deadlineStr = project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : ''
      const message = `${alert.emoji} Ola ${client.name}! O projeto '${project.name}' tem entrega prevista para ${deadlineStr} (${alert.days} dia${alert.days > 1 ? 's' : ''}). ${alert.prefix}`

      await sendWhatsApp(client.phone, message).catch(() => {})

      await prisma.deadlineAlert.create({
        data: { projectId: project.id, type: `deadline_${alert.days}d` },
      }).catch(() => {})

      sent++
    }
  }

  return NextResponse.json({ sent, skipped })
}
