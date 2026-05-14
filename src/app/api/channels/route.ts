import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: channels })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar canais' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, isPrivate } = body

    const channel = await prisma.channel.create({
      data: { name, description, type: type || 'project', isPrivate: isPrivate || false },
    })

    return NextResponse.json({ data: channel }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar canal' }, { status: 500 })
  }
}
