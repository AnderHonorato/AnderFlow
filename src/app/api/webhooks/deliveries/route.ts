import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')

  const deliveries = await prisma.webhookDelivery.findMany({
    where: since ? { createdAt: { gte: new Date(since) } } : {},
    include: { endpoint: { select: { url: true, secret: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ data: deliveries })
}
