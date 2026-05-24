export interface EmailTemplateData {
  name?: string
  projectName?: string
  projectStatus?: string
  progress?: number
  invoiceAmount?: string
  invoiceDueDate?: string
  daysUntilDue?: number
  ticketTitle?: string
  replyPreview?: string
  contractId?: string
  npsLink?: string
  code?: string
  baseUrl?: string
}

const baseLayout = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 16px">
    <tr>
      <td align="center" style="padding-bottom:24px">
        <span style="font-size:24px;font-weight:700;color:#E8622A;letter-spacing:-0.5px">ANDERFLOW</span>
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#12121A;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden">
          ${content}
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:24px">
        <p style="font-size:11px;color:#5C5C58;line-height:1.6;margin:0">
          ANDERFLOW — Solucoes Digitais<br>
          Este email foi enviado automaticamente. Por favor, nao responda.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

const buttonStyle = 'display:inline-block;background:#E8622A;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;margin-top:16px'

export function generateEmailHtml(type: string, data: EmailTemplateData = {}): string {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  switch (type) {
    case 'welcome':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 8px">Bem-vindo ao ANDERFLOW!</h2>
          <p style="font-size:13px;color:#A8A8A2;line-height:1.6;margin:0">Ola${data.name ? ' ' + data.name : ''}, sua conta foi criada com sucesso. Acesse o portal para solicitar projetos e acompanhar cada etapa.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${baseUrl}/portal" style="${buttonStyle}">Acessar Portal</a>
        </td></tr>
      `)

    case 'verification':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 8px">Seu codigo de verificacao</h2>
          <p style="font-size:13px;color:#A8A8A2;line-height:1.6;margin:0">Use o codigo abaixo para confirmar sua identidade. Valido por 30 minutos.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;text-align:center">
          <div style="background:#1A1A1F;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:24px">
            <span style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#E8622A">${data.code || '------'}</span>
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;text-align:center">
          <p style="font-size:11px;color:#5C5C58;margin:0">Se voce nao solicitou este codigo, ignore este email.</p>
        </td></tr>
      `)

    case 'project_update':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 12px">Seu projeto foi atualizado</h2>
          <div style="background:#1A1A1F;border-radius:10px;padding:20px;border:1px solid rgba(255,255,255,0.06)">
            <p style="font-size:14px;font-weight:600;color:#F0F0EB;margin:0 0 6px">${data.projectName || 'Projeto'}</p>
            <p style="font-size:12px;color:#A8A8A2;margin:0 0 12px">Status: <span style="color:#E8622A;font-weight:600">${data.projectStatus || 'Atualizado'}</span></p>
            ${data.progress !== undefined ? `
            <div style="background:rgba(255,255,255,0.04);border-radius:6px;height:6px;overflow:hidden;margin-bottom:8px">
              <div style="width:${data.progress}%;height:100%;background:#E8622A;border-radius:6px"></div>
            </div>
            <p style="font-size:11px;color:#5C5C58;margin:0">${data.progress}% concluido</p>
            ` : ''}
          </div>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${baseUrl}/portal/projects" style="${buttonStyle}">Ver Projeto</a>
        </td></tr>
      `)

    case 'invoice_due':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 12px">Fatura proxima do vencimento</h2>
          <div style="background:#1A1A1F;border-radius:10px;padding:20px;border:1px solid rgba(255,255,255,0.06)">
            <p style="font-size:24px;font-weight:700;color:#E8622A;margin:0 0 8px">${data.invoiceAmount || 'R$ 0,00'}</p>
            <p style="font-size:12px;color:#A8A8A2;margin:0 0 4px">Vencimento: ${data.invoiceDueDate || 'N/A'}</p>
            <p style="font-size:12px;color:#F0A060;margin:0">${data.daysUntilDue !== undefined ? `Vence em ${data.daysUntilDue} dias` : ''}</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${baseUrl}/portal/financial" style="${buttonStyle}">Ver Fatura</a>
        </td></tr>
      `)

    case 'ticket_reply':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 12px">Seu ticket foi respondido</h2>
          <p style="font-size:14px;color:#F0F0EB;margin:0 0 8px">${data.ticketTitle || 'Ticket'}</p>
          ${data.replyPreview ? `
          <div style="background:#1A1A1F;border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.06);margin-top:8px">
            <p style="font-size:12px;color:#A8A8A2;line-height:1.6;margin:0">${data.replyPreview}</p>
          </div>
          ` : ''}
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${baseUrl}/portal/chat" style="${buttonStyle}">Ver Resposta</a>
        </td></tr>
      `)

    case 'contract_ready':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 8px">Contrato pronto para assinar</h2>
          <p style="font-size:13px;color:#A8A8A2;line-height:1.6;margin:0">O contrato do projeto <strong style="color:#E8622A">${data.projectName || 'seu projeto'}</strong> esta disponivel para assinatura.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${baseUrl}/portal/contracts" style="${buttonStyle}">Assinar Agora</a>
        </td></tr>
      `)

    case 'nps_request':
      return baseLayout(`
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <h2 style="font-size:18px;font-weight:600;color:#F0F0EB;margin:0 0 8px">Avalie sua experiencia</h2>
          <p style="font-size:13px;color:#A8A8A2;line-height:1.6;margin:0">Seu projeto foi concluido! Sua opiniao e muito importante para nos. Leva menos de 1 minuto.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${data.npsLink || baseUrl + '/portal/feedback'}" style="${buttonStyle}">Avaliar Agora</a>
        </td></tr>
      `)

    default:
      return baseLayout(`
        <tr><td style="padding:32px;text-align:center">
          <p style="font-size:13px;color:#A8A8A2;line-height:1.6;margin:0">Ola${data.name ? ' ' + data.name : ''}, voce tem uma nova atualizacao no ANDERFLOW.</p>
        </td></tr>
      `)
  }
}
