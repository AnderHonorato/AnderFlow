import { prisma } from '@/lib/prisma'

export async function sendWhatsApp(phone: string, message: string) {
  const EVOLUTION_URL = process.env.WHATSAPP_API_URL || ''
  const EVOLUTION_KEY = process.env.WHATSAPP_API_KEY || ''
  const INSTANCE = process.env.WHATSAPP_INSTANCE || 'anderflow'

  if (!EVOLUTION_URL || !EVOLUTION_KEY) return { sent: false, error: 'WhatsApp não configurado' }

  const number = phone.replace(/\D/g, '')

  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number: `${number}@s.whatsapp.net`,
        text: message,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { sent: false, error: err }
    }

    return { sent: true }
  } catch (error: any) {
    return { sent: false, error: error?.message || 'Erro ao enviar' }
  }
}

export function isWhatsAppConfigured(): boolean {
  const EVOLUTION_URL = process.env.WHATSAPP_API_URL || ''
  const EVOLUTION_KEY = process.env.WHATSAPP_API_KEY || ''
  return !!(EVOLUTION_URL && EVOLUTION_KEY)
}

export async function getClientPhone(clientId: string): Promise<string | null> {
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { phone: true, name: true },
  })
  return client?.phone || null
}
