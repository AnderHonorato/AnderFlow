import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
    },
  })

  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

  if (!isAdmin(user) && project.clientId !== user.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const [tasks, milestones, timeEntries, invoices] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: id },
      include: { assignee: { select: { name: true } } },
      orderBy: { order: 'asc' },
    }),
    prisma.milestone.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' },
    }),
    prisma.timeEntry.findMany({
      where: { projectId: id },
      include: { user: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalHours = timeEntries.reduce((s, e) => s + (e.hours || 0), 0)
  const totalInvoiceValue = invoices.reduce((s, i) => s + i.total, 0)
  const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório — ${project.name}</title>
  <style>
    @media print {
      @page { margin: 15mm; size: A4; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e; font-size: 12px; line-height: 1.6;
      max-width: 800px; margin: 0 auto; padding: 40px 20px;
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 20px; border-bottom: 3px solid #E8622A; margin-bottom: 24px;
    }
    .header h1 { font-size: 22px; font-weight: 700; color: #E8622A; letter-spacing: -0.5px; }
    .header .logo { font-size: 14px; color: #E8622A; font-weight: 700; }
    .meta { color: #666; font-size: 11px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; font-weight: 600; color: #E8622A; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; text-transform: uppercase; letter-spacing: 0.5px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric { padding: 12px; background: #fafafa; border-radius: 8px; border: 1px solid #eee; text-align: center; }
    .metric .value { font-size: 22px; font-weight: 700; color: #E8622A; }
    .metric .label { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 8px 6px; background: #f5f5f5; font-weight: 600; color: #444; border-bottom: 2px solid #ddd; font-size: 10px; text-transform: uppercase; }
    td { padding: 7px 6px; border-bottom: 1px solid #eee; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .badge-done { background: #e8f5e9; color: #2e7d32; }
    .badge-progress { background: #fff3e0; color: #e65100; }
    .badge-todo { background: #f5f5f5; color: #666; }
    .text-right { text-align: right; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ANDERFLOW</div>
      <h1>${escHtml(project.name)}</h1>
      <p class="meta">
        Cliente: ${escHtml(project.client?.company || project.client?.name || 'N/A')}
        ${project.number ? ` · ${escHtml(project.number)}` : ''}
        · ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:700;color:#E8622A">${project.progress || 0}%</div>
      <div style="font-size:10px;color:#666">Progresso</div>
    </div>
  </div>

  <div class="metrics">
    <div class="metric"><div class="value">${tasks.length}</div><div class="label">Tarefas</div></div>
    <div class="metric"><div class="value">${completedTasks}</div><div class="label">Concluídas</div></div>
    <div class="metric"><div class="value">${totalHours.toFixed(1)}h</div><div class="label">Horas</div></div>
    <div class="metric"><div class="value">R$ ${totalInvoiceValue.toLocaleString('pt-BR')}</div><div class="label">Faturas</div></div>
  </div>

  <div class="section">
    <h2>Tarefas (${tasks.length})</h2>
    <table>
      <thead><tr><th>Título</th><th>Status</th><th>Responsável</th><th class="text-right">Prazo</th></tr></thead>
      <tbody>
        ${tasks.map(t => `<tr>
          <td>${escHtml(t.title)}</td>
          <td><span class="badge ${t.status === 'DONE' || t.status === 'COMPLETED' ? 'badge-done' : t.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-todo'}">${t.status === 'DONE' || t.status === 'COMPLETED' ? 'Concluída' : t.status === 'IN_PROGRESS' ? 'Em andamento' : 'A fazer'}</span></td>
          <td>${escHtml(t.assignee?.name || '-')}</td>
          <td class="text-right">${t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Nenhuma tarefa</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Marcos (${milestones.length})</h2>
    <table>
      <thead><tr><th>Nome</th><th>Descrição</th><th class="text-right">Prazo</th></tr></thead>
      <tbody>
        ${milestones.map(m => `<tr>
          <td>${escHtml(m.name)}</td>
          <td>${escHtml(m.description || '-')}</td>
          <td class="text-right">${m.dueDate ? new Date(m.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
        </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:#999">Nenhum marco</td></tr>'}
      </tbody>
    </table>
  </div>

  ${invoices.length > 0 ? `
  <div class="section">
    <h2>Faturas (${invoices.length})</h2>
    <table>
      <thead><tr><th>Número</th><th>Status</th><th class="text-right">Valor</th><th class="text-right">Vencimento</th></tr></thead>
      <tbody>
        ${invoices.map(i => `<tr>
          <td>${escHtml(i.number || '')}</td>
          <td><span class="badge ${i.status === 'PAID' ? 'badge-done' : 'badge-progress'}">${i.status === 'PAID' ? 'Pago' : i.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}</span></td>
          <td class="text-right">R$ ${i.total.toLocaleString('pt-BR')}</td>
          <td class="text-right">${i.dueDate ? new Date(i.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Horas Registradas (${timeEntries.length})</h2>
    <table>
      <thead><tr><th>Data</th><th>Profissional</th><th>Descrição</th><th class="text-right">Horas</th></tr></thead>
      <tbody>
        ${timeEntries.slice(0, 30).map(e => `<tr>
          <td>${e.date ? new Date(e.date).toLocaleDateString('pt-BR') : '-'}</td>
          <td>${escHtml(e.user?.name || '-')}</td>
          <td>${escHtml(e.description || '-')}</td>
          <td class="text-right">${e.hours || 0}h</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Nenhum registro</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">
    ANDERFLOW — Relatório gerado em ${new Date().toLocaleString('pt-BR')}
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
