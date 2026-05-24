import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const entityType = searchParams.get('entityType')

    const where: any = {}
    if (!isAdmin(user)) {
      where.requiredBy = user.id
    }
    if (status !== 'all') {
      where.status = status
    }
    if (entityType) {
      where.entityType = entityType
    }

    const approvals = await prisma.approvalFlow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const enrichedApprovals = []

    for (const approval of approvals) {
      let entityName = ''
      let entityDetail = ''

      if (approval.entityType === 'project') {
        const project = await prisma.project.findUnique({
          where: { id: approval.entityId },
          select: { name: true, proposalValue: true, client: { select: { name: true } } },
        })
        entityName = project?.name || approval.entityId
        entityDetail = project?.client?.name || ''
      } else if (approval.entityType === 'invoice') {
        const invoice = await prisma.invoice.findUnique({
          where: { id: approval.entityId },
          select: { number: true, total: true },
        })
        entityName = invoice?.number || approval.entityId
        entityDetail = invoice?.total ? `R$ ${invoice.total.toLocaleString('pt-BR')}` : ''
      } else if (approval.entityType === 'contract') {
        const contract = await prisma.contract.findUnique({
          where: { id: approval.entityId },
          select: { id: true },
        })
        entityName = contract?.id ? `Contrato #${contract.id.slice(0, 8)}` : approval.entityId
      }

      const requiredByUser = await prisma.user.findUnique({
        where: { id: approval.requiredBy },
        select: { name: true },
      })

      enrichedApprovals.push({
        ...approval,
        entityName,
        entityDetail,
        requiredByName: requiredByUser?.name || '',
      })
    }

    return NextResponse.json({ data: enrichedApprovals })
  } catch (error: any) {
    console.error('[approvals GET]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      entityType: z.enum(['project', 'invoice', 'contract']),
      entityId: z.string(),
      requiredBy: z.string(),
      comment: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.flatten() }, { status: 400 })

    const approval = await prisma.approvalFlow.create({
      data: {
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        requiredBy: parsed.data.requiredBy,
        comment: parsed.data.comment || '',
      },
    })

    return NextResponse.json({ data: approval }, { status: 201 })
  } catch (error: any) {
    console.error('[approvals POST]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      id: z.string(),
      action: z.enum(['approve', 'reject']),
      comment: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.flatten() }, { status: 400 })

    const { id, action, comment } = parsed.data

    const approval = await prisma.approvalFlow.findUnique({ where: { id } })
    if (!approval) return NextResponse.json({ error: 'Aprovacao nao encontrada' }, { status: 404 })
    if (approval.status !== 'pending') return NextResponse.json({ error: 'Aprovacao ja processada' }, { status: 400 })

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      comment: comment || '',
    }
    if (action === 'approve') updateData.approvedAt = new Date()
    else updateData.rejectedAt = new Date()

    const updated = await prisma.approvalFlow.update({ where: { id }, data: updateData })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('[approvals PATCH]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
