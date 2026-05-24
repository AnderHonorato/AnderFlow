import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, company: true, email: true } },
        project: { select: { name: true } },
      },
    })

    if (!invoice) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })

    const items = JSON.parse(invoice.items || '[]')
    const date = new Date(invoice.paidAt || invoice.createdAt)
    const dateStr = date.toLocaleDateString('pt-BR')
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo ${invoice.number}</title><style>
      body{font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0EB;padding:40px;max-width:600px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
      .logo{color:#E8622A;font-size:20px;font-weight:700}.number{color:#5C5C58;font-size:12px}
      .card{background:#141418;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;margin-bottom:16px}
      .label{color:#5C5C58;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px}
      .value{color:#F0F0EB;font-size:14px;font-weight:500}
      .divider{border-top:1px solid rgba(255,255,255,0.06);margin:16px 0}
      table{width:100%;border-collapse:collapse}.th{text-align:left;color:#5C5C58;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px}
      .td{color:#A8A8A2;font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
      .total{font-size:18px;font-weight:700;color:#E8622A;text-align:right;margin-top:12px}
      .footer{text-align:center;color:#5C5C58;font-size:11px;margin-top:32px}
    </style></head><body>
      <div class="header"><div class="logo">ANDERFLOW</div><div class="number">RECIBO · ${invoice.number}</div></div>
      <div class="card">
        <div class="label">Data do pagamento</div><div class="value">${dateStr} às ${timeStr}</div>
        <div class="divider"></div>
        <div class="label">Cliente</div><div class="value">${invoice.client?.name || 'N/A'}${invoice.client?.company ? ' · ' + invoice.client.company : ''}</div>
        <div class="label" style="margin-top:8px">Projeto</div><div class="value">${invoice.project?.name || 'N/A'}</div>
      </div>
      <div class="card">
        <div class="label">Itens</div>
        <table><thead><tr><th class="th">Descrição</th><th class="th" style="text-align:right">Qtd</th><th class="th" style="text-align:right">Valor</th><th class="th" style="text-align:right">Subtotal</th></tr></thead><tbody>
          ${items.map((i: any) => `<tr><td class="td">${i.description || 'Item'}</td><td class="td" style="text-align:right">${i.quantity}</td><td class="td" style="text-align:right">R$ ${i.price.toFixed(2)}</td><td class="td" style="text-align:right">R$ ${(i.quantity * i.price).toFixed(2)}</td></tr>`).join('')}
        </tbody></table>
        <div class="divider"></div>
        <p class="total">Total: R$ ${invoice.total.toFixed(2)}</p>
      </div>
      <div class="footer"><p>ANDERFLOW Sistemas · CNPJ 00.000.000/0001-00</p><p>Este recibo foi gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}.</p></div>
    </body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar recibo' }, { status: 500 })
  }
}
