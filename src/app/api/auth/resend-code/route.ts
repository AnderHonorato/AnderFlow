import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

function generateCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Email nao encontrado' }, { status: 404 })
    }

    if (type === 'register' && user.isAccountActive) {
      return NextResponse.json({ error: 'Conta ja esta ativa. Faca login.' }, { status: 400 })
    }

    if (user.codeExpiresAt && new Date() < new Date(user.codeExpiresAt.getTime() - 29 * 60000)) {
      return NextResponse.json({
        message: 'Codigo enviado recentemente. Aguarde 60 segundos para reenviar.',
        cooldown: true,
      }, { status: 200 })
    }

    const code = generateCode()
    const expires = new Date(Date.now() + 30 * 60000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        codeExpiresAt: expires,
        verificationMethod: 'EMAIL',
      },
    })

    await sendVerificationEmail(email, code)

    return NextResponse.json({ ok: true, message: 'Codigo reenviado! Verifique seu email.' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao reenviar codigo' }, { status: 500 })
  }
}
