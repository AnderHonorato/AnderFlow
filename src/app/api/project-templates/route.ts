import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET() {
  try {
    const templates = await prisma.projectTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: templates.map((t) => ({
        ...t,
        tasks: (() => { try { return JSON.parse(t.tasks) } catch { return [] } })(),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { name, description, tasks } = body

    if (!name?.trim() || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Nome e lista de tasks são obrigatórios' }, { status: 400 })
    }

    const template = await prisma.projectTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        tasks: JSON.stringify(tasks),
      },
    })

    return NextResponse.json({ data: template }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await prisma.projectTemplate.delete({ where: { id } })
    return NextResponse.json({ message: 'Template removido' })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover template' }, { status: 500 })
  }
}
