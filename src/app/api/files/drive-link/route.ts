import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      projectId: z.string().optional(),
      name: z.string().min(1).max(255),
      driveUrl: z.string().url(),
      mimeType: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.flatten() }, { status: 400 })

    const { projectId, name, driveUrl, mimeType } = parsed.data

    const file = await prisma.file.create({
      data: {
        name,
        originalName: name,
        mimeType: mimeType || 'application/vnd.google-apps.document',
        size: 0,
        url: driveUrl,
        projectId: projectId || null,
        uploadedBy: user.id,
      },
    })

    return NextResponse.json({ data: file }, { status: 201 })
  } catch (error: any) {
    console.error('[files/drive-link]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
