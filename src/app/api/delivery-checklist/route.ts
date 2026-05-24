import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId obrigatorio' }, { status: 400 })

    const checklist = await prisma.deliveryChecklist.findUnique({
      where: { projectId },
    })

    return NextResponse.json({ data: checklist })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      projectId: z.string(),
      items: z.array(z.object({ id: z.string(), label: z.string(), checked: z.boolean(), note: z.string().optional() })),
      completedAt: z.string().datetime().optional(),
      completedBy: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

    const checklist = await prisma.deliveryChecklist.upsert({
      where: { projectId: parsed.data.projectId },
      update: {
        items: parsed.data.items,
        completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : undefined,
        completedBy: parsed.data.completedBy,
      },
      create: {
        projectId: parsed.data.projectId,
        items: parsed.data.items,
        completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : undefined,
        completedBy: parsed.data.completedBy,
      },
    })

    return NextResponse.json({ data: checklist })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
