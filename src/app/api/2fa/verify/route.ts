import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

export async function POST(request: NextRequest) {
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

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    })

    return NextResponse.json({ valid: verified })
  } catch {
    return NextResponse.json({ valid: false, error: 'Erro ao verificar' }, { status: 500 })
  }
}
