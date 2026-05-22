import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json()
    if (!email || !code || !password) return NextResponse.json({ error: 'Email, codigo e senha obrigatorios' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 })

    const token = await prisma.verificationToken.findFirst({
      where: { identifier: email, token: code, expires: { gt: new Date() } },
    })
    if (!token) return NextResponse.json({ error: 'Codigo invalido ou expirado' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    return NextResponse.json({ data: { ok: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
