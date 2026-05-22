import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const bots = await prisma.user.findMany({
      where: { isBot: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        botStatus: true,
        botLastActionAt: true,
        botContext: true,
      },
      orderBy: { role: 'asc' },
    })

    const data = bots.map(b => {
      let ctx: any = {}
      try { ctx = b.botContext ? JSON.parse(b.botContext) : {} } catch {}
      return {
        id: b.id,
        name: b.name,
        email: b.email,
        role: b.role,
        status: b.botStatus || 'IDLE',
        lastAction: b.botLastActionAt?.toISOString() || null,
        actionCount: ctx.actions?.length || 0,
        pendingDependency: ctx.pendingDependency || null,
      }
    })

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
