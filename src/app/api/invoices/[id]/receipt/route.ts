import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, company: true, email: true } },
        project: { select: { name: true } },
      },
    })

    if (!invoice) return NextResponse.json({ error: 'Fatura nao encontrada' }, { status: 404 })

    const items = JSON.parse(invoice.items || '[]')
    const issuedDate = new Date(invoice.createdAt).toLocaleDateString('pt-BR')
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-BR') : '-'
    const paidDate = invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('pt-BR') : null
    const isPaid = invoice.status === 'PAID'
    const tax = invoice.tax || 0
    const discount = invoice.discount || 0
    const subtotal = (invoice.total || 0) - tax + discount

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Fatura ${invoice.number} - ANDERFLOW</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #f8f9fa; padding: 40px 20px; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: #1a1a2e; color: #fff; padding: 32px 40px; }
  .header .logo { font-size: 24px; font-weight: 700; color: #E8622A; }
  .header .title { font-size: 13px; color: #a0a0b0; margin-top: 4px; }
  .header .number { font-size: 15px; font-weight: 600; margin-top: 16px; }
  .body { padding: 32px 40px; }
  .row { display: flex; gap: 40px; margin-bottom: 24px; }
  .col { flex: 1; }
  .label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 14px; color: #1a1a2e; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; color: #888; padding: 8px 12px; border-bottom: 2px solid #eee; letter-spacing: 0.5px; }
  td { font-size: 13px; color: #333; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
  .text-right { text-align: right; }
  .summary { margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #555; padding: 4px 0; }
  .summary-total { font-size: 18px; font-weight: 700; color: #E8622A; margin-top: 8px; padding-top: 8px; border-top: 2px solid #E8622A; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 16px; }
  .status-paid { background: #e8f5e9; color: #2e7d32; }
  .status-pending { background: #fff3e0; color: #e65100; }
  .status-overdue { background: #ffebee; color: #c62828; }
  .notes { margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  .footer .bank-info { font-size: 10px; color: #aaa; margin-top: 4px; }
  .print-btn { position: fixed; bottom: 20px; right: 20px; background: #E8622A; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .print-btn:hover { background: #d4551e; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; max-width: 100%; }
    .print-btn { display: none; }
    @page { size: A4; margin: 15mm; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">ANDERFLOW</div>
      <div class="title">Solucoes Digitais</div>
      <div class="number">FATURA #${invoice.number}</div>
    </div>

    <div class="body">
      <div class="row">
        <div class="col">
          <div class="label">Prestador de Servico</div>
          <div class="value">
            ANDERFLOW Sistemas<br/>
            CNPJ: 00.000.000/0001-00<br/>
            contato@anderflow.com.br
          </div>
        </div>
        <div class="col">
          <div class="label">Tomador / Cliente</div>
          <div class="value">
            ${invoice.client?.name || 'N/A'}<br/>
            ${invoice.client?.company || ''}<br/>
            ${invoice.client?.email || ''}
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="label">Data de Emissao</div>
          <div class="value">${issuedDate}</div>
        </div>
        <div class="col">
          <div class="label">Data de Vencimento</div>
          <div class="value">${dueDate}</div>
        </div>
        <div class="col">
          <div class="label">Projeto</div>
          <div class="value">${invoice.project?.name || 'N/A'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descricao</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Valor Unit.</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((i: any) => `
            <tr>
              <td>${i.description || 'Servico'}</td>
              <td class="text-right">${i.quantity || 1}</td>
              <td class="text-right">R$ ${(i.price || 0).toFixed(2)}</td>
              <td class="text-right">R$ ${((i.quantity || 1) * (i.price || 0)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="summary-row"><span>Desconto</span><span>-R$ ${discount.toFixed(2)}</span></div>` : ''}
        ${tax > 0 ? `<div class="summary-row"><span>Impostos</span><span>R$ ${tax.toFixed(2)}</span></div>` : ''}
        <div class="summary-row summary-total"><span>TOTAL</span><span>R$ ${invoice.total.toFixed(2)}</span></div>
      </div>

      <div class="status-badge ${isPaid ? 'status-paid' : invoice.status === 'OVERDUE' ? 'status-overdue' : 'status-pending'}">
        ${isPaid ? `PAGO em ${paidDate}` : invoice.status === 'OVERDUE' ? 'VENCIDO' : 'PENDENTE'}
      </div>

      ${invoice.notes ? `<div class="notes"><strong>Observacoes:</strong><br/>${(invoice.notes || '').replace(/\n/g, '<br/>')}</div>` : ''}

      <div class="footer">
        <p>ANDERFLOW Sistemas &middot; CNPJ 00.000.000/0001-00</p>
        <p class="bank-info">Banco: 000 &middot; Agencia: 0000 &middot; Conta: 00000-0 &middot; PIX: contato@anderflow.com.br</p>
        <p style="margin-top:8px">Este documento foi gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}.</p>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
</body>
</html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar recibo' }, { status: 500 })
  }
}
