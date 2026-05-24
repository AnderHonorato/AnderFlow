import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [projectTags, ticketTags] = await Promise.all([
    prisma.project.findMany({ select: { tags: true }, where: { tags: { not: '[]' } } }),
    prisma.ticket.findMany({ select: { tags: true }, where: { tags: { not: '[]' } } }),
  ])

  const tagSet = new Set<string>()
  projectTags.forEach(p => {
    try { JSON.parse(p.tags).forEach((t: string) => tagSet.add(t)) } catch {}
  })
  ticketTags.forEach(t => {
    try { JSON.parse(t.tags).forEach((tg: string) => tagSet.add(tg)) } catch {}
  })

  return NextResponse.json({ data: { tags: Array.from(tagSet).sort() } })
}
