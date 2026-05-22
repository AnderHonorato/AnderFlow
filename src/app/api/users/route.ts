import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getSessionUser,
  isOwner,
  canManageRole,
  getRoleLevel,
  parsePermissions,
  ROLE_LEVELS,
} from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (user.roleLevel < 60) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roleParam = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    const andConditions: any[] = []

    if (user.roleLevel < 100) {
      const excludedRoles = Object.entries(ROLE_LEVELS)
        .filter(([_, level]) => level >= user.roleLevel)
        .map(([role]) => role)
      andConditions.push({ role: { notIn: excludedRoles } })
    }

    if (roleParam) {
      andConditions.push({ role: roleParam })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }
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
          isBot: true, botStatus: true,
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
    return NextResponse.json({ error: 'Erro ao buscar usuários', data: [], total: 0 }, { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, permissions, isActive, role } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids obrigatório' }, { status: 400 })
    }

    const data: any = {}
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions)
    if (isActive !== undefined) {
      data.isActive = isActive
      data.deleteRequestedAt = isActive ? null : undefined
      data.deleteScheduledAt = isActive ? null : undefined
    }
    if (role !== undefined) {
      const allowedRoles = ['OWNER', 'ADMIN', 'MODERATOR', 'DEVELOPER', 'USER', 'GUEST']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Função inválida' }, { status: 400 })
      }
      if (!canManageRole(user.role, role)) {
        return NextResponse.json({ error: 'Você não pode atribuir essa função' }, { status: 403 })
      }
      data.role = role
    }

    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    })

    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, permissions: true, isActive: true, role: true },
    })

    for (const u of updatedUsers) {
      const changes: string[] = []
      if (permissions !== undefined) changes.push('permissões atualizadas')
      if (isActive !== undefined) changes.push(isActive ? 'conta reativada' : 'conta desativada')
      if (role !== undefined) changes.push(`função alterada para ${role}`)

      if (changes.length > 0) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: 'ACCOUNT_UPDATE',
            title: 'Alteração na sua conta',
            message: `Um administrador fez as seguintes alterações: ${changes.join(', ')}.`,
            isRead: false,
          },
        })
      }
    }

    return NextResponse.json({ message: 'Usuários atualizados', count: updatedUsers.length })
  } catch (error: any) {
    console.error('[users] PATCH error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao atualizar usuários' }, { status: 200 })
  }
}
