import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    return NextResponse.json({ data: ticket })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const ticket = await prisma.ticket.update({ where: { id }, data: body })

    if (body.status === 'RESOLVED' && ticket.creatorId) {
      const creator = await prisma.user.findUnique({ where: { id: ticket.creatorId }, select: { phone: true } })
      if (creator?.phone) {
        sendWhatsApp(creator.phone, `Ticket #${ticket.number} resolvido: "${ticket.title}".`).catch(() => {})
      }
    }

    return NextResponse.json({ data: ticket })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}
