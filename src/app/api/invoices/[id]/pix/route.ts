import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { generatePixPayload } from '@/lib/pix'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return unauthorizedResponse()

  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
  }

  if (user.id !== invoice.clientId && (user.roleLevel || 0) < 40) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const pixKeySetting = await prisma.setting.findUnique({ where: { key: 'pix_key' } })
  const pixKey = pixKeySetting?.value || process.env.PIX_KEY || ''

  if (!pixKey) {
    return NextResponse.json({ error: 'Chave PIX não configurada' }, { status: 400 })
  }

  const txId = `INV-${invoice.number || invoice.id.slice(0, 8)}`
  const customerCity = invoice.client?.company ? 'SAO PAULO' : 'BRASILIA'

  const pixPayload = generatePixPayload({
    pixKey,
    amount: invoice.total,
    name: invoice.client?.name || 'Cliente',
    city: customerCity,
    txId,
  })

  const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })

  return NextResponse.json({
    data: {
      pixPayload,
      qrCodeBase64,
      txId,
      amount: invoice.total,
      invoiceNumber: invoice.number,
    },
  })
}
