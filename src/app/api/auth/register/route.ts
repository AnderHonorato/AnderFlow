import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
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
  if (!rateLimit('register:' + ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { name, email, password, company, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha sao obrigatorios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter no minimo 8 caracteres' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Formato de email invalido' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      if (existing.isAccountActive) {
        return NextResponse.json({ error: 'Email ja cadastrado' }, { status: 400 })
      }

      if (existing.codeExpiresAt && new Date() < existing.codeExpiresAt) {
        return NextResponse.json({
          message: 'Codigo ja enviado. Verifique seu email ou aguarde expirar para reenviar.',
          codeSent: true,
        }, { status: 200 })
      }

      const code = generateCode()
      const expires = new Date(Date.now() + 30 * 60000)

      const hashedPassword = await bcrypt.hash(password, 12)

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashedPassword,
          company,
          phone,
          verificationCode: code,
          codeExpiresAt: expires,
          verificationMethod: 'EMAIL',
        },
      })

      await sendVerificationEmail(email, code)

      return NextResponse.json({ message: 'Codigo reenviado! Verifique seu email.', codeSent: true }, { status: 200 })
    }

    const code = generateCode()
    const expires = new Date(Date.now() + 30 * 60000)
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        phone,
        role: 'CLIENT',
        isActive: true,
        isAccountActive: false,
        verificationCode: code,
        codeExpiresAt: expires,
        verificationMethod: 'EMAIL',
      },
    })

    await sendVerificationEmail(email, code)

    return NextResponse.json(
      { message: 'Conta pre-cadastrada! Verifique seu email para o codigo de confirmacao.', codeSent: true },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar conta' }, { status: 500 })
  }
}
