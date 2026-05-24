import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    const isAdminUser = user && isAdmin(user)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = { isOnline: true, lastSeen: { gte: new Date(Date.now() - 5 * 60000) } }
    if (!isAdminUser && user) {
      where.id = user.id
    }

    const onlineUsers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        currentPage: true,
        lastSeen: true,
      },
      orderBy: { lastSeen: 'desc' },
    })

    return NextResponse.json({ data: onlineUsers })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
