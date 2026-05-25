import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { connectWithQR, connectWithCode } from '@/lib/whatsapp-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const { method, phone } = await request.json().catch(() => ({}))

    if (method === 'code') {
      if (!phone) {
        return NextResponse.json({ error: 'Telefone obrigatorio para conexao por codigo' }, { status: 400 })
      }
      const result = await connectWithCode(phone)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ data: { status: 'connecting', method: 'code', pairingCode: result.code } })
    }

    const result = await connectWithQR()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ data: { status: 'connecting', method: 'qr' } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao conectar' }, { status: 500 })
  }
}
