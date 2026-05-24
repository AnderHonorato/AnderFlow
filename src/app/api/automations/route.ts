import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: automations })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar automações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { name, trigger, conditions, actions } = body

    if (!name?.trim() || !trigger || !actions) {
      return NextResponse.json({ error: 'Nome, trigger e actions são obrigatórios' }, { status: 400 })
    }

    const automation = await prisma.automation.create({
      data: {
        name: name.trim(),
        trigger,
        conditions: conditions ? JSON.stringify(conditions) : null,
        actions: JSON.stringify(actions),
      },
    })

    return NextResponse.json({ data: automation }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar automação' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { id, isActive, name, trigger, conditions, actions } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da automação é obrigatório' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (name) data.name = name
    if (trigger) data.trigger = trigger
    if (conditions !== undefined) data.conditions = conditions ? JSON.stringify(conditions) : null
    if (actions) data.actions = JSON.stringify(actions)

    const automation = await prisma.automation.update({
      where: { id },
      data,
    })

    return NextResponse.json({ data: automation })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar automação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da automação é obrigatório' }, { status: 400 })
    }

    await prisma.automation.delete({ where: { id } })
    return NextResponse.json({ message: 'Automação removida' })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover automação' }, { status: 500 })
  }
}
