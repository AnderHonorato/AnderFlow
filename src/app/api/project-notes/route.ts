import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isDeveloperOrAbove(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId obrigatório' }, { status: 400 })

  const notes = await prisma.projectNote.findMany({
    where: { projectId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ data: notes })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isDeveloperOrAbove(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { projectId, content } = body
  if (!projectId || content === undefined) return NextResponse.json({ error: 'projectId e content obrigatórios' }, { status: 400 })

  const existing = await prisma.projectNote.findFirst({ where: { projectId, authorId: user.id } })

  let note
  if (existing) {
    note = await prisma.projectNote.update({ where: { id: existing.id }, data: { content } })
  } else {
    note = await prisma.projectNote.create({ data: { projectId, content, authorId: user.id } })
  }

  return NextResponse.json({ data: note })
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isDeveloperOrAbove(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  await prisma.projectNote.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
