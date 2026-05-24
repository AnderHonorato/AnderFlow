import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { id } = await params
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, company: true, email: true } },
      project: { select: { name: true } },
    },
  })

  if (!contract || contract.status !== 'SIGNED') {
    return NextResponse.json({ error: 'Contrato nao encontrado ou nao assinado' }, { status: 404 })
  }

  const isAdmin = (user as any).roleLevel >= 80
  const isOwner = contract.clientId === user.id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const signedDate = contract.signedAt ? new Date(contract.signedAt).toLocaleString('pt-BR') : '-'
  const signerIp = contract.signerIp || 'N/A'
  const contentHash = crypto.createHash('sha256').update(contract.content).digest('hex')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Comprovante ${contract.title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Inter,sans-serif;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}
  h1{font-size:20px;margin-bottom:8px;color:#E8622A}
  .meta{color:#888;font-size:12px;margin-bottom:24px}
  .content{background:#f8f9fa;border-radius:8px;padding:24px;white-space:pre-wrap;font-size:14px;line-height:1.6;margin-bottom:24px;border:1px solid #eee}
  .signature-section{border-top:2px solid #E8622A;padding-top:24px}
  .sig-img{border:1px solid #ddd;border-radius:8px;padding:8px;max-width:220px;margin:12px 0}
  .sig-img img{max-width:200px;display:block}
  .sig-text{font-size:13px;color:#555;margin-top:8px}
  .hash{font-family:monospace;font-size:10px;color:#999;word-break:break-all;background:#f0f0f0;padding:8px;border-radius:4px;margin-top:8px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999}
  .print-btn{position:fixed;bottom:20px;right:20px;background:#E8622A;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px}
  @media print{body{padding:20px}.print-btn{display:none}@page{size:A4;margin:15mm}}
</style></head><body>
  <h1>Comprovante de Assinatura Digital</h1>
  <div class="meta">ANDERFLOW Sistemas &middot; Contrato #${contract.id.slice(0, 8)}</div>

  <div class="content">${contract.content.replace(/\n/g, '<br/>')}</div>

  <div class="signature-section">
    <p style="font-size:16px;font-weight:600;margin-bottom:12px">Assinatura Digital</p>
    ${contract.signature ? `<div class="sig-img"><img src="${contract.signature}" alt="Assinatura"/></div>` : ''}
    <p class="sig-text"><strong>Documento assinado digitalmente por:</strong> ${contract.client?.name || 'N/A'}</p>
    <p class="sig-text"><strong>Empresa:</strong> ${contract.client?.company || '-'}</p>
    <p class="sig-text"><strong>Email:</strong> ${contract.client?.email || '-'}</p>
    <p class="sig-text"><strong>Data da assinatura:</strong> ${signedDate}</p>
    <p class="sig-text"><strong>IP do signatario:</strong> ${signerIp}</p>
    ${contract.project ? `<p class="sig-text"><strong>Projeto:</strong> ${contract.project.name}</p>` : ''}
    <p class="sig-text" style="margin-top:12px;color:#2e7d32;font-weight:600">Este documento possui validade juridica conforme MP 2.200-2/2001.</p>
    <div class="hash">SHA-256: ${contentHash}</div>
  </div>

  <div class="footer">
    <p>ANDERFLOW Sistemas &middot; CNPJ 00.000.000/0001-00</p>
    <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
</body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
