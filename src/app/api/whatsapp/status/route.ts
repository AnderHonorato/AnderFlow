import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { getConnectionState } from '@/lib/whatsapp-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const state = getConnectionState()
    return NextResponse.json({ data: state })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}
