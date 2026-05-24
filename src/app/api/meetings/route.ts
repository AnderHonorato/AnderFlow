import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 40) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const where: any = {}
  if (projectId) where.projectId = projectId

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: meetings })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 40) return unauthorizedResponse()

  const body = await request.json()
  const { projectId, title, date, transcript, audioUrl } = body

  if (!projectId || !title || !date) {
    return NextResponse.json({ error: 'Campos obrigatorios: projectId, title, date' }, { status: 400 })
  }

  const meeting = await prisma.meeting.create({
    data: {
      projectId,
      title,
      date: new Date(date),
      transcript: transcript || null,
      audioUrl: audioUrl || null,
    },
  })

  return NextResponse.json({ data: meeting }, { status: 201 })
}
