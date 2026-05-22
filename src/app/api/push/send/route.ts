import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { sendPushToUser } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const { userId, title, body, url } = await request.json()
    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'userId, title e body obrigatorios' }, { status: 400 })
    }

    const result = await sendPushToUser(userId, title, body, url)

    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao enviar push' }, { status: 500 })
  }
}
