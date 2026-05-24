import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    const isAdminUser = user && isAdmin(user)

    const { searchParams } = new URL(request.url)
    const showAll = isAdminUser && searchParams.get('admin') === 'true'

    const where = showAll ? {} : { isPublic: true, publishedAt: { not: null } }

    const entries = await prisma.changelogEntry.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: entries })
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { version, title, description, type, isPublic } = body

    if (!version || !title || !description) {
      return NextResponse.json({ error: 'version, title e description sao obrigatorios' }, { status: 400 })
    }

    const entry = await prisma.changelogEntry.create({
      data: {
        version,
        title,
        description,
        type: type || 'feature',
        isPublic: isPublic || false,
        publishedAt: isPublic ? new Date() : null,
      },
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar entrada' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { id, isPublic } = body

    const entry = await prisma.changelogEntry.update({
      where: { id },
      data: {
        isPublic: !!isPublic,
        publishedAt: isPublic ? new Date() : null,
      },
    })

    return NextResponse.json({ data: entry })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar entrada' }, { status: 500 })
  }
}
