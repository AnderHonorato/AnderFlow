import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, type } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email e codigo sao obrigatorios' }, { status: 400 })
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

    if (type === 'register') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isAccountActive: true,
          emailVerified: new Date(),
          verificationCode: null,
          codeExpiresAt: null,
        },
      })

      return NextResponse.json({ ok: true, message: 'Conta verificada com sucesso!' })
    }

    if (type === 'password') {
      return NextResponse.json({ ok: true, message: 'Codigo valido. Defina sua nova senha.' })
    }

    return NextResponse.json({ error: 'Tipo de verificacao invalido' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao verificar codigo' }, { status: 500 })
  }
}
