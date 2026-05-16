import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const lead = await prisma.lead.update({ where: { id }, data: body })
    return NextResponse.json({ data: lead })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    const { id } = await params
    await prisma.lead.update({ where: { id }, data: { status: 'LOST' } })
    return NextResponse.json({ message: 'Lead arquivado' })
  } catch { return NextResponse.json({ error: 'Erro' }, { status: 200 }) }
}
