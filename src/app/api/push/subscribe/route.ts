import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { subscription } = await request.json()
    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: 'Subscription invalida' }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { keys: subscription.keys, userId: token.id as string },
      create: {
        userId: token.id as string,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar subscription' }, { status: 500 })
  }
}
