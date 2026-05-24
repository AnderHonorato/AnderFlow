import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['brandColor', 'brandLogo', 'name', 'email', 'company', 'phone', 'plan']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) data[key] = body[key]
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, brandColor: true, brandLogo: true },
    })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}
