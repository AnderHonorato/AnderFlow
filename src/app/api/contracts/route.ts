import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const where: any = {}
    if (!isAdmin(user)) {
      where.clientId = user.id
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: { client: { select: { id: true, name: true, company: true } }, project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: contracts })
  } catch (error) {
    return NextResponse.json({ data: [], error: 'Erro ao buscar contratos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { title, content, clientId, projectId, value, startDate, endDate, status, autoRenew } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 })

    const contractClientId = isAdmin(user) ? (clientId || user.id) : user.id

    const contract = await prisma.contract.create({
      data: {
        title: title.trim(),
        content: content || '',
        clientId: contractClientId,
        projectId: projectId || null,
        value: value || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'DRAFT',
        autoRenew: autoRenew || false,
      },
      include: { client: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error: any) {
    console.error('[contracts:POST]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar contrato' }, { status: 500 })
  }
}
