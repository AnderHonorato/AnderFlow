import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const where: any = {}
    if (clientId) where.clientId = clientId

    const channels = await prisma.channel.findMany({
      where,
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
    const { name, description, type, isPrivate, clientId } = body

    const data: any = { name, description, type: type || 'project', isPrivate: isPrivate || false }
    if (clientId) data.clientId = clientId

    const channel = await prisma.channel.create({ data })

    return NextResponse.json({ data: channel }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar canal' }, { status: 500 })
  }
}
