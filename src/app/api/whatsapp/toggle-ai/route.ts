import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { toggleAIMode } from '@/lib/whatsapp-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const aiMode = toggleAIMode()
    return NextResponse.json({ data: { aiMode } })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
