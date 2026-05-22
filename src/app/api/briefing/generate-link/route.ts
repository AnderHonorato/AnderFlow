import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (!isAdmin(user)) return unauthorizedResponse()

    const { clientId } = await request.json()
    if (!clientId) {
      return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })
    }

    const token = await new SignJWT({ clientId, type: 'briefing' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    return NextResponse.json({ data: { token, link: `/briefing-public/${token}` } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao gerar link' }, { status: 500 })
  }
}
