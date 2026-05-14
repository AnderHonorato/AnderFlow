import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Pega o usuário do token JWT ou fallback para dev
async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const { getToken } = await import('next-auth/jwt')
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token?.id) return token.id as string
  } catch {}
  // Fallback: pega o primeiro admin do banco (modo dev)
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  return admin?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const where: any = { isArchived: false }
    const status = searchParams.get('status')
    if (status) where.status = status

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: projects })
  } catch {
    return NextResponse.json({ data: [], error: 'Erro' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, description, type } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome do projeto obrigatório' }, { status: 400 })
    }

    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Pega o primeiro cliente se o usuário for admin, senão usa o próprio ID
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const clientId = user?.role === 'CLIENT' ? userId : (body.clientId || userId)

    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug,
        description: description || '',
        type: type || 'CUSTOM',
        clientId,
        priority: 'MEDIUM',
        tags: JSON.stringify([]),
      },
      include: { client: { select: { id: true, name: true } } },
    })

    // Notificar admin sobre novo projeto
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'PROJECT_UPDATE',
        title: 'Projeto criado',
        message: `Projeto "${name}" criado com sucesso`,
        isRead: false,
      },
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar projeto' }, { status: 200 })
  }
}
