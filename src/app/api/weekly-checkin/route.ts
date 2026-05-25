import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import * as jose from 'jose'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, mood } = body

    if (!token || !mood || mood < 1 || mood > 4) {
      return NextResponse.json({ error: 'Token e mood (1-4) são obrigatórios' }, { status: 400 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')

    let payload: { clientId: string; week: number; projectId?: string }
    try {
      const { payload: verified } = await jose.jwtVerify(token, secret)
      payload = verified as { clientId: string; week: number; projectId?: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    if (!payload.clientId || !payload.week) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const existing = await prisma.weeklyCheckin.findFirst({
      where: { clientId: payload.clientId, week: payload.week },
    })

    if (existing) {
      return NextResponse.json({ error: 'Check-in desta semana já foi registrado' }, { status: 409 })
    }

    const checkin = await prisma.weeklyCheckin.create({
      data: {
        clientId: payload.clientId,
        projectId: payload.projectId || null,
        mood,
        week: payload.week,
      },
    })

    return NextResponse.json({ data: checkin, message: 'Check-in registrado com sucesso!' }, { status: 201 })
  } catch (error) {
    console.error('[weekly-checkin:POST]', error)
    return NextResponse.json({ error: 'Erro ao registrar check-in' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId

    const checkins = await prisma.weeklyCheckin.findMany({
      where: isAdmin(user) ? where : { ...where, clientId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 52,
    })

    if (clientId) {
      const avgMood = checkins.length > 0
        ? checkins.reduce((s, c) => s + c.mood, 0) / checkins.length
        : 0

      return NextResponse.json({
        data: checkins,
        stats: { total: checkins.length, avgMood: Math.round(avgMood * 10) / 10 },
      })
    }

    return NextResponse.json({ data: checkins })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar check-ins' }, { status: 500 })
  }
}
