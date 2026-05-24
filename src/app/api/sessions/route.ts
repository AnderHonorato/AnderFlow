import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { unauthorizedResponse } from '@/lib/auth-utils'

function parseUserAgent(ua: string | null): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido', isMobile: false }

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)

  let browser = 'Desconhecido'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari'
  else if (/OPR\//.test(ua) || /Opera\//.test(ua)) browser = 'Opera'

  let os = 'Desconhecido'
  if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac/.test(ua)) os = 'Mac'
  else if (/Linux/.test(ua) && !/Android/.test(ua)) os = 'Linux'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iOS/.test(ua)) os = 'iOS'

  return { browser, os, isMobile }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return unauthorizedResponse()

  const sessions = await prisma.session.findMany({
    where: { userId: token.id as string },
    orderBy: { expires: 'desc' },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
      ipAddress: true,
      userAgent: true,
    },
  })

  const currentSessionToken = token.sessionToken || ''

  const data = sessions.map(s => ({
    id: s.id,
    expires: s.expires,
    ipAddress: s.ipAddress,
    isCurrent: s.sessionToken === currentSessionToken || sessions.indexOf(s) === 0,
    ...parseUserAgent(s.userAgent),
  }))

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  const all = searchParams.get('all')

  const currentSessionToken = token.sessionToken as string

  if (all === 'true') {
    await prisma.session.deleteMany({
      where: {
        userId: token.id as string,
        sessionToken: { not: currentSessionToken },
      },
    })
    return NextResponse.json({ data: { message: 'Todas as outras sessoes foram revogadas' } })
  }

  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })
    if (!session || session.userId !== token.id) {
      return NextResponse.json({ error: 'Sessao nao encontrada' }, { status: 404 })
    }
    if (session.sessionToken === currentSessionToken) {
      return NextResponse.json({ error: 'Nao pode revogar a sessao atual' }, { status: 400 })
    }
    await prisma.session.delete({ where: { id: sessionId } })
    return NextResponse.json({ data: { message: 'Sessao revogada' } })
  }

  return NextResponse.json({ error: 'Parametro sessionId ou all obrigatorio' }, { status: 400 })
}
