import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTemplateEmail } from '@/lib/email/envio'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  try {
    const clients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'CLIENT',
        createdAt: {
          gte: new Date(currentYear - 5, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0),
        },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    const admin = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      select: { id: true },
    })

    let count = 0

    for (const client of clients) {
      const creationMonth = new Date(client.createdAt).getMonth()
      if (creationMonth !== currentMonth) continue

      const years = currentYear - new Date(client.createdAt).getFullYear()
      if (years < 1) continue

      const title = `🎉 ${years} ano(s) de parceria com ${client.name}!`
      const message = `Hoje completamos ${years} ano(s) de parceria. E uma otima oportunidade para reforcar o relacionamento.`

      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title,
            message,
            metadata: JSON.stringify({ clientId: client.id, years, type: 'anniversary' }),
          },
        })
      }

      if (client.email) {
        sendTemplateEmail(client.email, 'welcome', {
          name: client.name,
          years,
          title,
          message,
        }).catch((err) => { console.error('[birthday-check email]', err?.message || err) })
      }

      count++
    }

    return NextResponse.json({ checked: clients.length, anniversaries: count })
  } catch (error: any) {
    console.error('[cron:birthday-check]', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
