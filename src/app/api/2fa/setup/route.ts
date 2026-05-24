import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const secret = speakeasy.generateSecret({ name: `ANDERFLOW:${user.email}` })
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')

  return NextResponse.json({ data: { secret: secret.base32, qrCodeUrl } })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { token, secret: userSecret } = body

    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json({ error: 'Código inválido. Tente novamente.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: userSecret, twoFactorEnabled: true },
    })

    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Erro ao verificar 2FA' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  })

  return NextResponse.json({ data: { ok: true } })
}
