import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, password } = body

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Email, codigo e nova senha sao obrigatorios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email, verificationCode: code },
    })

    if (!user) {
      return NextResponse.json({ error: 'Codigo incorreto.' }, { status: 400 })
    }

    if (user.codeExpiresAt && new Date() > user.codeExpiresAt) {
      return NextResponse.json({ error: 'Codigo expirado. Solicite um novo.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationCode: null,
        codeExpiresAt: null,
      },
    })

    return NextResponse.json({ ok: true, message: 'Senha alterada com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao redefinir senha' }, { status: 500 })
  }
}
