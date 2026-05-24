import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { id } = await params
    const contract = await prisma.contract.findUnique({ where: { id } })
    if (!contract) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    return NextResponse.json({ data: contract })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    // Save current version before updating if content changed
    if (body.content) {
      const current = await prisma.contract.findUnique({ where: { id }, select: { content: true } })
      if (current && current.content !== body.content) {
        const lastVersion = await prisma.contractVersion.findFirst({
          where: { contractId: id },
          orderBy: { version: 'desc' },
        })
        const nextVersion = (lastVersion?.version || 0) + 1

        await prisma.contractVersion.create({
          data: {
            contractId: id,
            content: current.content,
            version: nextVersion,
            createdBy: user.name || user.id,
          },
        })
      }
    }

    const updated = await prisma.contract.update({ where: { id }, data: body })
    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 })
  }
}
