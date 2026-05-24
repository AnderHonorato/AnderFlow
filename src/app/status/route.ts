import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [components, incidents] = await Promise.all([
      prisma.statusComponent.findMany({ orderBy: { order: 'asc' } }),
      prisma.statusIncident.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const statusLabel: Record<string, string> = {
      operational: 'Operacional',
      degraded: 'Degradado',
      outage: 'Indisponível',
    }

    const statusColor: Record<string, string> = {
      operational: 'var(--success)',
      degraded: 'var(--warning)',
      outage: 'var(--destructive)',
    }

    const allOperational = components.every(c => c.status === 'operational')

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Status · ANDERFLOW</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Inter,-apple-system,sans-serif;background:#0A0A0F;color:#F0F0EB;min-height:100vh;padding:40px 20px}
      .container{max-width:640px;margin:0 auto}
      .header{text-align:center;margin-bottom:40px}
      .logo{color:#E8622A;font-size:20px;font-weight:700;margin-bottom:8px}
      .status-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:100px;font-size:13px;font-weight:500}
      .status-badge.ok{background:rgba(61,154,110,0.1);color:#3D9A6E;border:1px solid rgba(61,154,110,0.2)}
      .status-badge.warn{background:rgba(196,133,42,0.1);color:#C4852A;border:1px solid rgba(196,133,42,0.2)}
      .status-badge.err{background:rgba(196,74,58,0.1);color:#C44A3A;border:1px solid rgba(196,74,58,0.2)}
      .card{background:#141418;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:16px}
      .comp-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
      .comp-row:last-child{border-bottom:none}
      .comp-name{font-size:14px;color:#F0F0EB}
      .comp-status{display:flex;align-items:center;gap:6px;font-size:12px}
      .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
      .incident{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
      .incident:last-child{border-bottom:none}
      .incident-title{font-size:14px;font-weight:500;color:#F0F0EB;margin-bottom:4px}
      .incident-msg{font-size:12px;color:#A8A8A2}
      .incident-date{font-size:11px;color:#5C5C58;margin-top:4px}
      .footer{text-align:center;font-size:11px;color:#5C5C58;margin-top:40px}
    </style></head><body>
      <div class="container">
        <div class="header">
          <div class="logo">ANDERFLOW</div>
          <div class="status-badge ${allOperational ? 'ok' : components.some(c => c.status === 'outage') ? 'err' : 'warn'}">
            <span class="dot" style="background:${allOperational ? '#3D9A6E' : components.some(c => c.status === 'outage') ? '#C44A3A' : '#C4852A'}"></span>
            ${allOperational ? 'Todos os sistemas operacionais' : 'Alguns sistemas com problema'}
          </div>
          <p style="font-size:11px;color:#5C5C58;margin-top:8px">Atualizado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="card">
          <p style="font-size:11px;color:#5C5C58;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">Componentes</p>
          ${components.map(c => `
            <div class="comp-row">
              <span class="comp-name">${c.name}</span>
              <span class="comp-status" style="color:${statusColor[c.status] || 'var(--text-3)'}">
                <span class="dot" style="background:${statusColor[c.status] || 'var(--text-3)'}"></span>
                ${statusLabel[c.status] || c.status}
              </span>
            </div>
          `).join('')}
        </div>

        ${incidents.length > 0 ? `
        <div class="card">
          <p style="font-size:11px;color:#5C5C58;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">Incidentes recentes</p>
          ${incidents.map(i => `
            <div class="incident">
              <p class="incident-title">${i.title}</p>
              <p class="incident-msg">${i.message}</p>
              <p class="incident-date">${new Date(i.createdAt).toLocaleString('pt-BR')} · ${i.resolvedAt ? 'Resolvido' : 'Em investigação'}</p>
            </div>
          `).join('')}
        </div>` : ''}

        <div class="footer">
          <p>ANDERFLOW Sistemas · Página de status pública</p>
        </div>
      </div>
    </body></html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return new NextResponse('Erro ao carregar status', { status: 500 })
  }
}
