import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner, parsePermissions } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (!isOwner(user)) {
      where.userId = user.id
    }
    if (status) {
      where.status = status
    }

    const requests = await prisma.permissionRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: requests, total: requests.length })
  } catch (error: any) {
    console.error('[permission-requests] GET error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao buscar solicitações', data: [], total: 0 }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { permission, reason } = body

    if (!permission || !reason) {
      return NextResponse.json({ error: 'Permissão e motivo são obrigatórios' }, { status: 400 })
    }

    const existing = await prisma.permissionRequest.findFirst({
      where: { userId: user.id, permission, status: 'pending' },
    })

    if (existing) {
      return NextResponse.json({ error: 'Você já tem uma solicitação pendente para esta permissão' }, { status: 409 })
    }

    const request_ = await prisma.permissionRequest.create({
      data: {
        userId: user.id,
        permission,
        reason,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ data: request_ }, { status: 201 })
  } catch (error: any) {
    console.error('[permission-requests] POST error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, isDefinitive } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id e status são obrigatórios' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status deve ser approved ou rejected' }, { status: 400 })
    }

    const permissionRequest = await prisma.permissionRequest.findUnique({ where: { id } })
    if (!permissionRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    const data: any = {
      status,
      resolvedAt: new Date(),
      resolvedBy: user.id,
    }

    if (isDefinitive) {
      data.isDefinitive = true
    }

    if (status === 'approved') {
      const targetUser = await prisma.user.findUnique({ where: { id: permissionRequest.userId } })
      if (targetUser) {
        const currentPermissions = parsePermissions(targetUser.permissions)
        if (!currentPermissions.includes(permissionRequest.permission)) {
          currentPermissions.push(permissionRequest.permission)
          await prisma.user.update({
            where: { id: permissionRequest.userId },
            data: { permissions: JSON.stringify(currentPermissions) },
          })
        }
      }
    }

    const updated = await prisma.permissionRequest.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('[permission-requests] PATCH error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 })
  }
}
