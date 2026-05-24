import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const usuario = await getSessionUser(request)
  if (!usuario) return unauthorizedResponse()

  try {
    let preferencias = await prisma.userPreference.findUnique({
      where: { userId: usuario.id },
    })

    if (!preferencias) {
      preferencias = await prisma.userPreference.create({
        data: { userId: usuario.id },
      })
    }

    return NextResponse.json({ data: preferencias })
  } catch (erro) {
    console.error('[configuracoes GET]', erro)
    return NextResponse.json({ error: 'Erro ao carregar configuracoes' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const usuario = await getSessionUser(request)
  if (!usuario) return unauthorizedResponse()

  try {
    const corpo = await request.json()
    const { notifPrefs, preferences } = corpo as {
      notifPrefs?: {
        emailNotifications?: boolean
        pushNotifications?: boolean
        soundEnabled?: boolean
        weeklyReport?: boolean
      }
      preferences?: Record<string, unknown>
    }

    const dados: Record<string, unknown> = {}

    if (notifPrefs) {
      if (typeof notifPrefs.emailNotifications === 'boolean') dados.emailNotifications = notifPrefs.emailNotifications
      if (typeof notifPrefs.pushNotifications === 'boolean') dados.pushNotifications = notifPrefs.pushNotifications
      if (typeof notifPrefs.soundEnabled === 'boolean') dados.soundEnabled = notifPrefs.soundEnabled
      if (typeof notifPrefs.weeklyReport === 'boolean') dados.weeklyReport = notifPrefs.weeklyReport
    }

    if (preferences !== undefined) {
      dados.preferences = preferences
    }

    const preferencias = await prisma.userPreference.upsert({
      where: { userId: usuario.id },
      create: { userId: usuario.id, ...dados as any },
      update: dados as any,
    })

    return NextResponse.json({ data: preferencias })
  } catch (erro) {
    console.error('[configuracoes PATCH]', erro)
    return NextResponse.json({ error: 'Erro ao salvar configuracoes' }, { status: 500 })
  }
}
