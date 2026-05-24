import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    return NextResponse.json({ data: { ...invoice, items: JSON.parse(invoice.items) } })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const invoice = await prisma.invoice.update({ where: { id }, data: body })

    if (body.status === 'PAID') {
      const fullInv = await prisma.invoice.findUnique({ where: { id }, include: { client: { select: { id: true } }, project: { select: { name: true } } } })
      if (fullInv?.client?.id) {
        await prisma.notification.create({
          data: {
            userId: fullInv.client.id,
            type: 'FINANCIAL',
            title: 'Pagamento confirmado',
            message: `Recibo disponível para a fatura ${fullInv.number}.${fullInv.project ? ' Projeto: ' + fullInv.project.name : ''}`,
            metadata: JSON.stringify({ invoiceId: id }),
          },
        })
      }
    }

    return NextResponse.json({ data: invoice })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}
