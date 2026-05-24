import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/middlewares/rate-limit'

function generateCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit('forgot-password:' + ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'Se o email existir, um codigo sera enviado' })
    }

    if (!user.isAccountActive) {
      return NextResponse.json({ error: 'Esta conta ainda nao foi ativada. Verifique seu email ou registre-se novamente.' }, { status: 400 })
    }

    if (user.codeExpiresAt && new Date() < user.codeExpiresAt) {
      return NextResponse.json({
        message: 'Codigo ja enviado. Verifique seu email ou aguarde expirar para reenviar.',
        codeSent: true,
      })
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

    return NextResponse.json({ message: 'Codigo enviado! Verifique seu email.', codeSent: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao processar' }, { status: 500 })
  }
}
