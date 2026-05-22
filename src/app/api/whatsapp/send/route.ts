import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import { getClientPhone } from '@/lib/whatsapp'
import { sendWhatsAppMessage } from '@/lib/whatsapp-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) return unauthorizedResponse()

    const { clientId, phone, message } = await request.json()
    const msg = message?.trim()
    if (!msg) return NextResponse.json({ error: 'Mensagem obrigatoria' }, { status: 400 })

    let targetPhone = phone
    if (!targetPhone && clientId) {
      targetPhone = await getClientPhone(clientId)
    }

    if (!targetPhone) {
      return NextResponse.json({ error: 'Telefone do cliente nao encontrado' }, { status: 400 })
    }

    const result = await sendWhatsAppMessage(targetPhone, msg)
    if (!result.sent) {
      return NextResponse.json({ error: result.error || 'Erro ao enviar mensagem' }, { status: 500 })
    }

    return NextResponse.json({ data: { ok: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao enviar' }, { status: 500 })
  }
}
