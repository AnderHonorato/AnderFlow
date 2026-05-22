import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_6Hicwqst_MrnvM2kJsWgYAYjbsDgwDsb5')

const SENDER = 'ANDERFLOW <noreply@anderflow.com.br>'

export async function sendVerificationEmail(to: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER,
      to,
      subject: 'Seu codigo de verificacao - ANDERFLOW',
      html: `
        <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0F;color:#F0F0EB;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:22px;font-weight:700;color:#E8622A">ANDERFLOW</span>
          </div>
          <h2 style="font-size:17px;font-weight:500;margin:0 0 8px;text-align:center">Seu codigo de verificacao</h2>
          <p style="font-size:13px;color:#A8A8A2;margin:0 0 24px;text-align:center">Use o codigo abaixo para confirmar sua identidade. Valido por 30 minutos.</p>
          <div style="background:#1A1A1F;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#E8622A">${code}</span>
          </div>
          <p style="font-size:11px;color:#5C5C58;margin:0;text-align:center">Se voce nao solicitou este codigo, ignore este email.</p>
        </div>
      `,
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

export { resend }
