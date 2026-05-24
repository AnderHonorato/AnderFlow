import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron de relatorio mensal automatico.
 * 
 * Agendamento:
 * - Vercel: adicione ao vercel.json: { "crons": [{ "path": "/api/cron/monthly-report", "schedule": "0 8 1 * *" }] }
 * - Servidor: crontab -e: 0 8 1 * * curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/monthly-report
 * - Dev: npm run cron:monthly
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    const clients = await prisma.user.findMany({
      where: { isActive: true, role: { notIn: ['ADMIN', 'OWNER', 'MODERATOR'] } },
      select: { id: true, name: true, email: true },
    })

    let sent = 0

    for (const client of clients) {
      const [projectsCount, completedProjects, resolvedTickets] = await Promise.all([
        prisma.project.count({
          where: { clientId: client.id, createdAt: { gte: lastMonth, lt: thisMonth } },
        }),
        prisma.project.count({
          where: { clientId: client.id, status: 'COMPLETED', updatedAt: { gte: lastMonth, lt: thisMonth } },
        }),
        prisma.ticket.count({
          where: { creatorId: client.id, status: 'RESOLVED', updatedAt: { gte: lastMonth, lt: thisMonth } },
        }),
      ])

      const monthName = lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

      await prisma.notification.create({
        data: {
          userId: client.id,
          type: 'SYSTEM',
          title: `Relatorio de ${monthName}`,
          message: `Resumo: ${projectsCount} projetos criados, ${completedProjects} concluidos, ${resolvedTickets} tickets resolvidos.`,
          metadata: JSON.stringify({ month: monthName, projectsCount, completedProjects, resolvedTickets }),
        },
      })

      sent++
    }

    return NextResponse.json({ sent })
  } catch (error: any) {
    console.error('[cron:monthly-report]', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
