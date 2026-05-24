import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const client = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandColor: true, brandLogo: true },
    })

    return NextResponse.json({
      data: {
        brandColor: client?.brandColor || null,
        brandLogo: client?.brandLogo || null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar branding' }, { status: 500 })
  }
}
