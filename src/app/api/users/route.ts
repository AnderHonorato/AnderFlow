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
import { verificarHierarquia, invalidarCache } from '@/lib/hierarquia-server'

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
      return NextResponse.json({ error: 'Você não tem permissão para gerenciar usuários.' }, { status: 403 })
    }

    // Verifica a hierarquia do solicitante no banco antes de qualquer alteração
    const verificacao = await verificarHierarquia(user.id, true)
    if (!verificacao.autorizado || verificacao.nivel < 100) {
      return NextResponse.json({
        error: 'Não foi possível verificar sua permissão no momento.',
        detalhe: 'Atualize a página para uma nova consulta ou tente novamente mais tarde.',
      }, { status: 403 })
    }

    const body = await request.json()
    const { ids, permissions, isActive, role } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs dos usuários são obrigatórios.' }, { status: 400 })
    }

    // Verifica os usuários alvo no banco antes de alterar
    const usuariosAlvo = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, name: true },
    })

    if (usuariosAlvo.length === 0) {
      return NextResponse.json({ error: 'Nenhum usuário encontrado com os IDs fornecidos.' }, { status: 404 })
    }

    const data: any = {}

    if (permissions !== undefined) {
      // Verifica permissão para alterar permissões
      if (verificacao.nivel < 100) {
        return NextResponse.json({ error: 'Apenas o Owner pode alterar permissões.' }, { status: 403 })
      }
      data.permissions = JSON.stringify(permissions)
    }

    if (isActive !== undefined) {
      data.isActive = isActive
      data.deleteRequestedAt = isActive ? null : undefined
      data.deleteScheduledAt = isActive ? null : undefined
    }

    if (role !== undefined) {
      const allowedRoles = ['OWNER', 'ADMIN', 'MODERATOR', 'DEVELOPER', 'USER', 'GUEST']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Cargo inválido. Os cargos permitidos são: Owner, Admin, Moderador, Desenvolvedor, Usuário e Visitante.' }, { status: 400 })
      }

      // Verifica se o solicitante pode gerenciar cada cargo alvo
      for (const alvo of usuariosAlvo) {
        if (!canManageRole(user.role, alvo.role || 'USER')) {
          return NextResponse.json({
            error: `Você não tem permissão para alterar o cargo de "${alvo.name}". O cargo atual é superior ou igual ao seu.`,
          }, { status: 403 })
        }
        if (!canManageRole(user.role, role)) {
          return NextResponse.json({
            error: `Você não pode atribuir o cargo "${role}". Seu nível de permissão não permite gerenciar este cargo.`,
          }, { status: 403 })
        }
      }

      data.role = role
    }

    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    })

    // Invalida cache de hierarquia para os usuários alterados
    for (const alvo of usuariosAlvo) {
      invalidarCache(alvo.id)
    }

    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, permissions: true, isActive: true, role: true },
    })

    for (const u of updatedUsers) {
      const changes: string[] = []
      if (permissions !== undefined) changes.push('permissões atualizadas')
      if (isActive !== undefined) changes.push(isActive ? 'conta reativada' : 'conta desativada')
      if (role !== undefined) changes.push(`cargo alterado para ${role}`)

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

    return NextResponse.json({ message: 'Usuários atualizados com sucesso.', count: updatedUsers.length })
  } catch (error: any) {
    console.error('[users] PATCH error:', error?.message || error)
    return NextResponse.json({
      error: 'Erro ao processar a solicitação.',
      detalhe: 'Verifique sua conexão e tente novamente.',
    }, { status: 200 })
  }
}
