import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q || q.trim().length < 1) {
      return NextResponse.json({ data: { projects: [], clients: [], tickets: [] } })
    }

    const query = q.trim()

    const [projects, clients, tickets] = await Promise.all([
      prisma.project.findMany({
        where: {
          isArchived: false,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        include: { client: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          role: 'CLIENT',
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, company: true },
        orderBy: { name: 'asc' },
      }),
      prisma.ticket.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        include: { creator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: { projects, clients, tickets },
    })
  } catch (error) {
    console.error('[search]', error)
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}
