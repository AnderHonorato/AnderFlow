import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { getChatHistory } from '@/lib/whatsapp-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const chats = getChatHistory()
    return NextResponse.json({ data: chats })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
