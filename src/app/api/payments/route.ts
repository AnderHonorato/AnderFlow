import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (!isAdmin(user)) where.clientId = user.id
    if (clientId && isAdmin(user)) where.clientId = clientId
    if (status) where.status = status

    const payments = await prisma.payment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        invoice: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: payments })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { invoiceId, clientId, amount, method, gateway, installments } = body

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        clientId,
        amount,
        method,
        gateway,
        installments: installments || 1,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 })
  }
}
