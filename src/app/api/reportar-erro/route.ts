import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const schemaRelatorio = z.object({
  screenshot: z.string().nullable(),
  comentario: z.string().max(2000).optional(),
  url: z.string().max(2000),
  userAgent: z.string().max(500),
  erroMsg: z.string().max(5000).optional(),
  timestamp: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dados = schemaRelatorio.safeParse(body)

    if (!dados.success) {
      return NextResponse.json({ erro: 'Dados invalidos' }, { status: 400 })
    }

    const devEmail = process.env.DEV_EMAIL
    if (!devEmail) {
      return NextResponse.json({ ok: true, mensagem: 'Email de desenvolvedor nao configurado' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY || '')

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E8622A;">Relatorio de Erro - ANDERFLOW</h2>
        <p><strong>Data:</strong> ${dados.data.timestamp}</p>
        <p><strong>URL:</strong> ${dados.data.url}</p>
        <p><strong>User Agent:</strong> ${dados.data.userAgent}</p>
        ${dados.data.erroMsg ? `<p><strong>Erro:</strong></p><pre style="background:#f5f5f5;padding:10px;border-radius:6px;font-size:12px;">${dados.data.erroMsg}</pre>` : ''}
        ${dados.data.comentario ? `<p><strong>Comentario do usuario:</strong></p><p style="background:#f5f5f5;padding:10px;border-radius:6px;">${dados.data.comentario}</p>` : ''}
        ${dados.data.screenshot ? `<p><strong>Captura de tela:</strong></p><img src="${dados.data.screenshot}" alt="Screenshot" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" />` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">Este relatorio foi enviado automaticamente pelo sistema de reporte de erros do ANDERFLOW. Nenhum dado pessoal sensivel foi armazenado no banco de dados.</p>
      </div>
    `

    await resend.emails.send({
      from: 'ANDERFLOW <noreply@anderflow.com.br>',
      to: devEmail,
      subject: `[ERRO] Relatorio de erro - ANDERFLOW`,
      html: htmlContent,
    })

    return NextResponse.json({ ok: true })
  } catch (erro: any) {
    return NextResponse.json({ erro: erro.message || 'Erro ao processar relatorio' }, { status: 500 })
  }
}
