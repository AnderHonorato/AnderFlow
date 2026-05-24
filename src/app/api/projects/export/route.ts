import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const clientId = searchParams.get('clientId')

  const where: any = { isArchived: false }
  if (status) where.status = status
  if (clientId) where.clientId = clientId

  const projects = await prisma.project.findMany({
    where,
    include: { client: { select: { name: true, company: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const rows = projects.map(p => [
    `"${p.number || ''}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${(p.client?.name || '').replace(/"/g, '""')}"`,
    p.status,
    p.priority,
    `${p.progress || 0}%`,
    p.createdAt?.toISOString().slice(0, 10) || '',
    p.deadline?.toISOString().slice(0, 10) || '',
    p.budget?.toString() || '0',
  ])

  const csv = [
    ['Número', 'Nome', 'Cliente', 'Status', 'Prioridade', 'Progresso', 'Data Início', 'Prazo', 'Valor'].join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n')

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=projetos-${new Date().toISOString().slice(0, 10)}.csv`,
    },
  })
}
