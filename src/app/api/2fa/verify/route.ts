import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import { rateLimit } from '@/lib/middlewares/rate-limit'
import { decrypt } from '@/lib/encrypt'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit('2fa-verify:' + ip, 10, 60_000)) {
    return NextResponse.json({ valid: false, error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { userId, token } = body

    if (!userId || !token) {
      return NextResponse.json({ valid: false, error: 'userId e token são obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      return NextResponse.json({ valid: false, error: '2FA não configurado' }, { status: 400 })
    }

    const secret = decrypt(user.twoFactorSecret)

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })

    return NextResponse.json({ valid: verified })
  } catch {
    return NextResponse.json({ valid: false, error: 'Erro ao verificar' }, { status: 500 })
  }
}
