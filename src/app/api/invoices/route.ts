import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const where: any = {}
    if (!isAdmin(user)) where.clientId = user.id

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: { select: { id: true, name: true, company: true } }, project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: invoices })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar faturas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Apenas administrador' }, { status: 403 })

  try {
    const body = await request.json()
    const { clientId, projectId, items, dueDate, notes, tax, discount } = body
    const subtotal = items.reduce((s: number, i: any) => s + (i.quantity * i.price), 0)
    const total = subtotal + (tax || 0) - (discount || 0)
    const count = await prisma.invoice.count()
    const number = `INV-${String(count + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: { number, clientId, projectId, items: JSON.stringify(items), subtotal, tax: tax || 0, discount: discount || 0, total, dueDate: new Date(dueDate), notes },
      include: { client: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar fatura' }, { status: 500 })
  }
}
