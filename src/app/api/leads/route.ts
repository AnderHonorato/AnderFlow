import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const ownerId = searchParams.get('ownerId')

    const where: any = {}
    if (status) where.status = status
    if (ownerId) where.ownerId = ownerId

    const leads = await prisma.lead.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: leads })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { name, email, phone, company, source, value, ownerId, notes } = body

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        source,
        value,
        ownerId,
        notes,
      },
    })

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
  }
}
