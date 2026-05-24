import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorizedResponse()

  const templates = await prisma.messageTemplate.findMany({
    where: { userId: user.id },
    orderBy: [{ uses: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ data: templates })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const body = await req.json()

  if (body.useIncrement) {
    await prisma.messageTemplate.update({
      where: { id: body.useIncrement },
      data: { uses: { increment: 1 } },
    })
    return NextResponse.json({ data: { success: true } })
  }

  const { title, content, variables } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 })
  }

  const template = await prisma.messageTemplate.create({
    data: {
      userId: user.id,
      title,
      content,
      variables: JSON.stringify(variables || []),
    },
  })

  return NextResponse.json({ data: template }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
  }

  const template = await prisma.messageTemplate.findUnique({ where: { id } })
  if (!template || template.userId !== user.id) {
    return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
  }

  await prisma.messageTemplate.delete({ where: { id } })

  return NextResponse.json({ data: { success: true } })
}
