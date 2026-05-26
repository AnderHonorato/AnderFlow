import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { chat } from '@/lib/deepseek'
import type { ChatMessage } from '@/lib/deepseek'

interface ReportCache {
  content: string
  generatedAt: number
  type: string
}

const cache = new Map<string, ReportCache>()
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 horas

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'weekly'
    const cached = searchParams.get('cached') === 'true'

    const cachedReport = cache.get(type)
    if (cached && cachedReport && Date.now() - cachedReport.generatedAt < CACHE_TTL) {
      return NextResponse.json({ content: cachedReport.content, cached: true, generatedAt: new Date(cachedReport.generatedAt).toISOString() })
    }

    const report = await generateReport(type)

    cache.set(type, { content: report, generatedAt: Date.now(), type })

    return NextResponse.json({ content: report, cached: false, generatedAt: new Date().toISOString() })
  } catch (error: any) {
    console.error('[reports GET]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao gerar relatorio' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { type, clientId } = await request.json()
    const reportType = (type as string) || 'weekly'

    if (reportType === 'client' && !clientId) {
      return NextResponse.json({ error: 'clientId obrigatorio para relatorio de cliente' }, { status: 400 })
    }

    const isAdminUser = isAdmin(user)
    if (reportType !== 'client' && !isAdminUser) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const report = reportType === 'client'
      ? await generateClientReport(clientId)
      : await generateReport(reportType)

    return NextResponse.json({ content: report, type: reportType })
  } catch (error: any) {
    console.error('[reports POST]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao gerar relatorio' }, { status: 500 })
  }
}

async function generateReport(type: string): Promise<string> {
  const now = new Date()
  const semanaInicio = new Date(now)
  semanaInicio.setDate(semanaInicio.getDate() - 7)

  const [
    receitaSemanal,
    novosClientes,
    projetosEntregues,
    ticketsResolvidos,
    novosTickets,
    clientesAtivos,
    tarefasConcluidas,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: semanaInicio } },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: semanaInicio } } }),
    prisma.project.count({ where: { status: 'COMPLETED', completedAt: { gte: semanaInicio } } }),
    prisma.ticket.count({ where: { status: 'CLOSED', closedAt: { gte: semanaInicio } } }),
    prisma.ticket.count({ where: { createdAt: { gte: semanaInicio } } }),
    prisma.project.count({ where: { status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] } } }),
    prisma.task.count({ where: { status: 'DONE', updatedAt: { gte: semanaInicio } } }),
  ])

  const dataFormatada = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (type === 'weekly') {
    const userPrompt = `Gere um relatorio executivo semanal do ANDERFLOW Sistemas. Use Chat Prefix Completion.

RESUMO DA SEMANA (${semanaInicio.toLocaleDateString('pt-BR')} a ${now.toLocaleDateString('pt-BR')}):
- Receita: R$ ${(receitaSemanal._sum?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Novos clientes: ${novosClientes}
- Projetos entregues: ${projetosEntregues}
- Tickets resolvidos: ${ticketsResolvidos}
- Novos tickets: ${novosTickets}
- Projetos ativos: ${clientesAtivos}
- Tarefas concluidas: ${tarefasConcluidas}

FORMATO DO RELATORIO:
# Relatorio Executivo — Semana de ${dataFormatada}

## Resumo Executivo
[2-3 paragrafos resumindo a semana]

## Metricas Principais
[listar metricas com comparacao da semana anterior se disponivel]

## Projetos em Destaque
[mencionar projetos entregues ou com progresso significativo]

## Suporte
[resumo dos tickets]

## Financeiro
[resumo financeiro]

## Proximos Passos
[recomendacoes para a proxima semana]

Seja profissional e direto. Use portugues do Brasil.`

    const messages: ChatMessage[] = [
      { role: 'system', content: 'Voce e um gerente de projetos senior do ANDERFLOW Sistemas. Gere relatorios executivos profissionais em portugues do Brasil. Use Markdown para formatacao. Seja conciso e orientado a dados.' },
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: `# Relatorio Executivo — Semana de ${dataFormatada}\n\n## Resumo Executivo\n` } as ChatMessage,
    ]

    const result = await chat(messages, { maxTokens: 2000, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' })
    return `# Relatorio Executivo — Semana de ${dataFormatada}\n\n## Resumo Executivo\n${result.content}`
  }

  if (type === 'health') {
    const userPrompt = `Gere uma analise de saude do negocio ANDERFLOW Sistemas.

DADOS:
- MRR estimado: R$ ${(receitaSemanal._sum?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (ultimos 7 dias)
- Novos clientes (7d): ${novosClientes}
- Projetos ativos: ${clientesAtivos}
- Projetos entregues (7d): ${projetosEntregues}
- Tickets abertos (7d): ${novosTickets}
- Tickets resolvidos (7d): ${ticketsResolvidos}
- Tarefas concluidas (7d): ${tarefasConcluidas}

Gere um relatorio de saude do negocio incluindo:
1. Metricas de MRR e tendencias
2. Estimativa de churn rate
3. Previsao para proximos 30 dias
4. Recomendacoes estrategicas

Use portugues do Brasil. Seja direto e orientado a acoes.`

    const result = await chat(
      [{ role: 'user', content: userPrompt }],
      { maxTokens: 1500, thinking: true, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' },
    )
    return `# Analise de Saude do Negocio — ${dataFormatada}\n\n${result.content}`
  }

  return '# Relatorio\n\nTipo de relatorio nao suportado.'
}

async function generateClientReport(clientId: string): Promise<string> {
  const [client, projects, invoices, tickets] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId }, select: { name: true, company: true } }),
    prisma.project.findMany({
      where: { clientId },
      select: { name: true, status: true, progress: true, deadline: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { clientId },
      select: { total: true, status: true, dueDate: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.ticket.findMany({
      where: { creatorId: clientId },
      select: { title: true, status: true, priority: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!client) return '# Erro\n\nCliente nao encontrado.'

  const totalFaturas = invoices.reduce((s, i) => s + i.total, 0)
  const faturasPendentes = invoices.filter(i => i.status === 'PENDING').length
  const projetosAtivos = projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status))

  const userPrompt = `Gere um relatorio do cliente ${client.name} (${client.company || 'N/A'}) para o portal do ANDERFLOW.

RESUMO:
- Projetos ativos: ${projetosAtivos.length}
- Total em projetos: ${projects.length}
- Total em faturas: R$ ${totalFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Faturas pendentes: ${faturasPendentes}
- Tickets abertos: ${tickets.filter(t => t.status === 'OPEN').length}

PROJETOS:
${projects.map(p => `- ${p.name} [${p.status}] ${p.progress}%${p.deadline ? ' — Prazo: ' + new Date(p.deadline).toLocaleDateString('pt-BR') : ''}`).join('\n')}

FATURAS:
${invoices.map(i => `- R$ ${i.total.toLocaleString('pt-BR')} [${i.status}]${i.dueDate ? ' — Venc: ' + new Date(i.dueDate).toLocaleDateString('pt-BR') : ''}`).join('\n')}

Gere um resumo amigavel para o cliente, destacando: progresso dos projetos, proximos marcos e qualquer acao necessaria.
Tom amigavel e orientado ao cliente. Portugues do Brasil. Maximo 300 palavras.`

  const result = await chat(
    [{ role: 'user', content: userPrompt }],
    { maxTokens: 800, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' },
  )

  return `# Relatorio — ${client.name}\n\n${result.content}`
}
