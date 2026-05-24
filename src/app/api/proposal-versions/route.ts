import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId obrigatorio' }, { status: 400 })

    const versions = await prisma.proposalVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json({ data: versions })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      projectId: z.string(),
      value: z.number().positive(),
      message: z.string().min(1),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

    const lastVersion = await prisma.proposalVersion.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { version: 'desc' },
    })
    const version = (lastVersion?.version || 0) + 1

    const pv = await prisma.proposalVersion.create({
      data: {
        projectId: parsed.data.projectId,
        value: parsed.data.value,
        message: parsed.data.message,
        version,
      },
    })

    return NextResponse.json({ data: pv }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
