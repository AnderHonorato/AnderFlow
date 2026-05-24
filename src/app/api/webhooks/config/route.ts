import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import crypto from 'crypto'

export async function GET() {
  const endpoints = await prisma.webhookEndpoint.findMany({
    include: {
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: endpoints })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { url, secret, events } = body

    if (!url?.trim() || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'URL e eventos são obrigatórios' }, { status: 400 })
    }

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url: url.trim(),
        secret: secret || crypto.randomBytes(32).toString('hex'),
        events,
      },
    })

    return NextResponse.json({ data: endpoint }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await prisma.webhookDelivery.deleteMany({ where: { endpointId: id } })
    await prisma.webhookEndpoint.delete({ where: { id } })

    return NextResponse.json({ message: 'Webhook removido' })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover webhook' }, { status: 500 })
  }
}
