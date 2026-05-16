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
    return NextResponse.json({ data: [], error: 'Erro ao buscar contratos' }, { status: 200 })
  }
}
