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
    const versions = await prisma.contractVersion.findMany({
      where: { contractId: id },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json({ data: versions })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar versões' }, { status: 500 })
  }
}
