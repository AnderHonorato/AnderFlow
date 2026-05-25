import { Resend } from 'resend'
import { generateEmailHtml } from './templates'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

const SENDER = 'ANDERFLOW <noreply@anderflow.com.br>'

export async function sendVerificationEmail(to: string, code: string) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured, skipping verification email')
    return true
  }
  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to,
      subject: 'Seu codigo de verificacao - ANDERFLOW',
      html: generateEmailHtml('verification', { code }),
      text: `Seu codigo de verificacao ANDERFLOW: ${code}\n\nValido por 30 minutos.\n\nSe voce nao solicitou este codigo, ignore este email.`,
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Email send error:', err)
    return false
  }
}

export async function sendTemplateEmail(to: string, template: string, data: Record<string, any> = {}) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured, skipping template email')
    return true
  }
  try {
    const subjects: Record<string, string> = {
      welcome: 'Bem-vindo ao ANDERFLOW!',
      project_update: 'Seu projeto foi atualizado',
      invoice_due: 'Fatura proxima do vencimento',
      ticket_reply: 'Seu ticket foi respondido',
      contract_ready: 'Contrato pronto para assinar',
      nps_request: 'Avalie sua experiencia com a ANDERFLOW',
    }

    const { error } = await resend.emails.send({
      from: SENDER,
      to,
      subject: subjects[template] || 'ANDERFLOW',
      html: generateEmailHtml(template, data),
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Email send error:', err)
    return false
  }
}

export { getResend }
