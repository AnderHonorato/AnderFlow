import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id }, select: { clientId: true } })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  if (!isAdmin(user) && project.clientId !== user.id) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const [activities, comments, invoices, contracts] = await Promise.all([
    prisma.activity.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.comment.findMany({ where: { projectId: id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.invoice.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.contract.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const items: { id: string; type: string; description: string; actor: string; createdAt: string }[] = []

  activities.forEach(a => items.push({
    id: a.id, type: 'update', description: a.details || a.action || 'Atividade',
    actor: a.type || a.userId, createdAt: a.createdAt.toISOString(),
  }))

  comments.forEach(c => items.push({
    id: c.id, type: 'comment', description: c.content.slice(0, 100),
    actor: c.user?.name || 'Usuário', createdAt: c.createdAt.toISOString(),
  }))

  invoices.forEach(i => items.push({
    id: i.id, type: 'invoice', description: `Fatura ${i.number} — R$ ${i.total.toLocaleString('pt-BR')} (${i.status === 'PAID' ? 'Pago' : 'Pendente'})`,
    actor: 'Sistema', createdAt: i.createdAt.toISOString(),
  }))

  contracts.forEach(c => items.push({
    id: c.id, type: 'contract', description: c.status === 'SIGNED' ? 'Contrato assinado' : 'Contrato gerado',
    actor: c.status === 'SIGNED' ? 'Cliente' : 'Sistema',
    createdAt: c.signedAt?.toISOString() || c.createdAt.toISOString(),
  }))

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ data: { items } })
}
