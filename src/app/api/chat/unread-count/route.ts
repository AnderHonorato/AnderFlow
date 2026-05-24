import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()

  try {
    const where = isAdmin(user)
      ? { isRead: false }
      : { isRead: false, channel: { clientId: user.id } }

    const count = await prisma.message.count({ where })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
