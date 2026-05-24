import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { sendWhatsApp } from '@/lib/whatsapp'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { auditLog } from '@/lib/audit'
import { sendWebhook } from '@/lib/webhook-sender'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const where: any = { isArchived: false }
    const status = searchParams.get('status')
    if (status) where.status = status

    // CLIENT: filtra apenas seus projetos. Admin ve tudo.
    if (!isAdmin(user)) {
      where.clientId = user.id
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: projects })
  } catch (error: any) {
    console.error('[projects GET]', error?.message || error)
    return NextResponse.json({ data: [], error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, description, type } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome do projeto obrigatorio' }, { status: 400 })
    }

    const clientId = isAdmin(user) ? (body.clientId || user.id) : user.id
    const status = isAdmin(user) ? (body.status || undefined) : 'PENDING'

    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug,
        description: description || '',
        type: type || 'CUSTOM',
        clientId,
        status,
        priority: 'MEDIUM',
        tags: JSON.stringify([]),
      },
      include: { client: { select: { id: true, name: true } } },
    })

    // Notificar o cliente que o projeto foi criado
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'PROJECT_UPDATE',
        title: 'Projeto criado com sucesso',
        message: `Seu projeto "${name}" foi recebido e esta aguardando analise da equipe.`,
        metadata: JSON.stringify({ projectId: project.id }),
        isRead: false,
      },
    })

    // Notificar todos os admins sobre novo projeto
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      if (admin.id === user.id) continue
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PROJECT_UPDATE',
          title: `Novo projeto: ${project.name}`,
          message: `"${name}" foi solicitado por ${project.client?.name || 'um cliente'}.`,
          metadata: JSON.stringify({ projectId: project.id }),
          isRead: false,
        },
      })
    }

    // Notificar via WhatsApp
    const client = await prisma.user.findUnique({ where: { id: clientId }, select: { phone: true } })
    if (client?.phone) {
      sendWhatsApp(client.phone, `Novo projeto criado: "${name}". Acompanhe pelo portal.`).catch(() => {})
    }

    checkAndGrantAchievements(clientId, 'first_project', project.id).catch(() => {})

    auditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      description: `Projeto criado: ${project.name}`,
    }).catch(() => {})

    sendWebhook('project_created', {
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      status: project.status,
      createdAt: project.createdAt?.toISOString(),
    }).catch(() => {})

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error: any) {
    console.error('[projects] POST error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar projeto' }, { status: 500 })
  }
}

// Internal helper called by other routes to award achievements
export async function grantProjectAchievements(userId: string, projectId: string, status?: string, progress?: number) {
  await checkAndGrantAchievements(userId, 'first_project', projectId)
  if (status === 'COMPLETED') {
    await checkAndGrantAchievements(userId, 'project_complete', projectId)
  }
  if (progress && progress >= 50) {
    await checkAndGrantAchievements(userId, 'project_halfway', projectId)
  }
}
