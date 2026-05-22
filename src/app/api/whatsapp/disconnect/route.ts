import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { disconnectWhatsApp } from '@/lib/whatsapp-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    await disconnectWhatsApp()
    return NextResponse.json({ data: { status: 'disconnected' } })
  } catch {
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
