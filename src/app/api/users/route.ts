import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }
    if (role) where.role = role
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (status === 'pending_deletion') where.deleteRequestedAt = { not: null }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, company: true,
          isActive: true, permissions: true, createdAt: true,
          deleteRequestedAt: true, deleteScheduledAt: true,
          _count: { select: { projects: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const parsed = users.map(u => ({
      ...u,
      permissions: parsePermissions(u.permissions),
    }))

    return NextResponse.json({ data: parsed, total, page, limit })
  } catch (error: any) {
    console.error('[users] GET error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao buscar usuarios', data: [], total: 0 }, { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, permissions, isActive, role } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids obrigatorio' }, { status: 400 })
    }

    const data: any = {}
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions)
    if (isActive !== undefined) {
      data.isActive = isActive
      data.deleteRequestedAt = isActive ? null : undefined
      data.deleteScheduledAt = isActive ? null : undefined
    }
    if (role !== undefined && ['ADMIN', 'CLIENT'].includes(role)) data.role = role

    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    })

    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, permissions: true, isActive: true, role: true },
    })

    for (const user of updatedUsers) {
      const changes: string[] = []
      if (permissions !== undefined) changes.push('permissoes atualizadas')
      if (isActive !== undefined) changes.push(isActive ? 'conta reativada' : 'conta desativada')
      if (role !== undefined) changes.push(`funcao alterada para ${role}`)

      if (changes.length > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACCOUNT_UPDATE',
            title: 'Alteracao na sua conta',
            message: `Um administrador fez as seguintes alteracoes: ${changes.join(', ')}.`,
            isRead: false,
          },
        })
      }
    }

    return NextResponse.json({ message: 'Usuarios atualizados', count: updatedUsers.length })
  } catch (error: any) {
    console.error('[users] PATCH error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao atualizar usuarios' }, { status: 200 })
  }
}

function parsePermissions(perm: string | null): string[] {
  try { return perm ? JSON.parse(perm) : [] } catch { return [] }
}
