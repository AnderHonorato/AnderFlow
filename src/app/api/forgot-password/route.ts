import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'Se o email existir, um link será enviado' })
    }

    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 3600000)

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    return NextResponse.json({ message: 'Se o email existir, um link será enviado' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
