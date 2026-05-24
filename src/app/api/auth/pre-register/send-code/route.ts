import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { rateLimit } from '@/lib/middlewares/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit('send-code:' + ip, 3, 5 * 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 5 minutos.' }, { status: 429 })
  }

  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, isActive: true } })
    if (!user) return NextResponse.json({ error: 'Email nao encontrado. Faca o pre-cadastro pelo WhatsApp primeiro.' }, { status: 404 })
    if (!user.isActive) return NextResponse.json({ error: 'Conta desativada' }, { status: 403 })

    const code = randomBytes(3).toString('hex').toUpperCase().slice(0, 6)

    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token: code } },
      update: { expires: new Date(Date.now() + 15 * 60 * 1000) },
      create: { identifier: email, token: code, expires: new Date(Date.now() + 15 * 60 * 1000) },
    })

    return NextResponse.json({ data: { sent: true, message: 'Codigo enviado. Verifique o email informado.' } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
