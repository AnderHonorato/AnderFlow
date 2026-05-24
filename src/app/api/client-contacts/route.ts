import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  try {
    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId

    const contacts = await prisma.clientContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: contacts })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { clientId, name, email, role, phone, canAccessPortal } = body

    if (!clientId || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'clientId, nome e email são obrigatórios' }, { status: 400 })
    }

    const contact = await prisma.clientContact.create({
      data: {
        clientId,
        name: name.trim(),
        email: email.trim(),
        role: role || 'Contato',
        phone: phone || null,
        canAccessPortal: canAccessPortal || false,
      },
    })

    return NextResponse.json({ data: contact }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { id, name, email, role, phone, canAccessPortal } = body

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (name) data.name = name
    if (email) data.email = email
    if (role) data.role = role
    if (phone !== undefined) data.phone = phone
    if (typeof canAccessPortal === 'boolean') data.canAccessPortal = canAccessPortal

    const contact = await prisma.clientContact.update({ where: { id }, data })

    return NextResponse.json({ data: contact })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

    await prisma.clientContact.delete({ where: { id } })
    return NextResponse.json({ message: 'Contato removido' })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover contato' }, { status: 500 })
  }
}
