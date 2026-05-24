import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { id } = await params

    const history = await prisma.projectBudgetHistory.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: history })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
