import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'terms'

    const doc = await prisma.legalDocument.findUnique({ where: { type } })

    if (!doc) {
      return NextResponse.json({
        data: { type, content: '', version: '1.0' },
      })
    }

    return NextResponse.json({ data: doc })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar documento' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { type, content, version } = body

    if (!type || !content || !version) {
      return NextResponse.json({ error: 'type, content e version sao obrigatorios' }, { status: 400 })
    }

    const doc = await prisma.legalDocument.upsert({
      where: { type },
      update: { content, version },
      create: { type, content, version },
    })

    return NextResponse.json({ data: doc })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar documento' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json()
    const { docType, docVersion } = body

    if (!docType || !docVersion) {
      return NextResponse.json({ error: 'docType e docVersion sao obrigatorios' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    await prisma.userConsent.create({
      data: {
        userId: user.id,
        docType,
        docVersion,
        ip,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar consentimento' }, { status: 500 })
  }
}
