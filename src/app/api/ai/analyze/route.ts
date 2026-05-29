import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { AI_CONFIG } from '@/lib/ai-config'

const DEEPSEEK_URL = `${AI_CONFIG.deepseek.baseUrl}/chat/completions`
const API_KEY = () => process.env.DEEPSEEK_API_KEY || ''

function getApiKey(): string {
  const key = API_KEY()
  if (!key) throw new Error('DEEPSEEK_API_KEY nao configurada')
  return key
}

function jsonSystemPrompt(): string {
  return `Voce e um analista de dados que retorna EXATAMENTE um objeto JSON valido.
NAO use markdown. NAO use blocos de codigo. NAO adicione explicacoes.
Retorne APENAS o JSON puro, com chaves { } no inicio e fim.
A palavra "json" esta presente neste prompt para ativar o modo JSON Output.`
}

async function callDeepSeekJson(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1000,
): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  const model = AI_CONFIG.deepseek.model

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    stream: false,
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.text().catch(() => '')
        if (attempt === 0 && (res.status === 429 || res.status === 503)) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 4000)
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        console.error(`[analyze] DeepSeek ${res.status}:`, err.slice(0, 300))
        throw new Error(`Erro ${res.status} na API DeepSeek`)
      }

      const data = await res.json()
      const rawContent = data?.choices?.[0]?.message?.content || ''

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(rawContent)
      } catch (parseErr) {
        if (attempt === 0) {
          console.warn('[analyze] JSON invalido na 1a tentativa, retry...')
          const delay = 500
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        console.error('[analyze] JSON invalido na 2a tentativa:', rawContent.slice(0, 200))
        throw new Error('Falha ao gerar JSON valido')
      }

      return parsed
    } catch (e) {
      if (attempt === 1 || (!(e instanceof Error)) || !e.message.includes('429') && !e.message.includes('503')) {
        throw e
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 4000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw new Error('Maximo de tentativas excedido')
}

function validateSchema(data: Record<string, unknown>, required: string[]): { valid: boolean; error?: string } {
  for (const field of required) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      return { valid: false, error: `Campo obrigatorio ausente: "${field}"` }
    }
  }
  return { valid: true }
}

// ============================================
// ANALYSIS HANDLERS
// ============================================

async function analyzeClient(clientId: string): Promise<Record<string, unknown>> {
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      id: true, name: true, email: true, company: true, createdAt: true,
      projects: {
        select: { id: true, name: true, status: true, progress: true, deadline: true },
        orderBy: { updatedAt: 'desc' }, take: 10,
      },
      invoices: {
        select: { id: true, total: true, status: true, dueDate: true },
        orderBy: { createdAt: 'desc' }, take: 10,
      },
      tickets: {
        select: { id: true, title: true, status: true, priority: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 10,
      },
      contracts: {
        select: { id: true, status: true, value: true },
        orderBy: { createdAt: 'desc' }, take: 5,
      },
    },
  })

  if (!client) throw new Error('Cliente nao encontrado')

  const activeProjects = client.projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length
  const completedProjects = client.projects.filter(p => p.status === 'COMPLETED').length
  const totalInvoiced = client.invoices.reduce((s, i) => s + i.total, 0)
  const pendingInvoices = client.invoices.filter(i => i.status === 'PENDING').length
  const overdueInvoices = client.invoices.filter(i => i.status === 'OVERDUE').length
  const openTickets = client.tickets.filter(t => t.status === 'OPEN').length

  const context = `DADOS DO CLIENTE:
Nome: ${client.name}
Email: ${client.email}
Empresa: ${client.company || 'Nao informada'}
Cliente desde: ${new Date(client.createdAt).toLocaleDateString('pt-BR')}

METRICAS:
- Projetos ativos: ${activeProjects}
- Projetos concluidos: ${completedProjects}
- Faturas total: R$ ${totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Faturas pendentes: ${pendingInvoices}
- Faturas atrasadas: ${overdueInvoices}
- Tickets abertos: ${openTickets}
- Contratos: ${client.contracts.length}

PROJETOS RECENTES:
${client.projects.map(p => `- ${p.name} [${p.status}] ${p.progress}%${p.deadline ? ' | Prazo: ' + new Date(p.deadline).toLocaleDateString('pt-BR') : ''}`).join('\n') || 'Nenhum'}

Retorne APENAS um objeto JSON valido. Inclua a palavra "json" nesta resposta. Campos:
{
  "health_score": number 0-100,
  "status": "excelente" | "bom" | "atencao" | "risco",
  "principais_riscos": string[],
  "oportunidades": string[],
  "proxima_acao_recomendada": string,
  "sentimento_geral": "positivo" | "neutro" | "negativo"
}`

  const system = jsonSystemPrompt()
  const data = await callDeepSeekJson(system, context, 1000)

  const validation = validateSchema(data, ['health_score', 'status', 'principais_riscos', 'oportunidades', 'proxima_acao_recomendada', 'sentimento_geral'])
  if (!validation.valid) {
    console.warn('[analyze/client] Schema invalido:', validation.error, data)
  }

  return data
}

async function analyzeProject(projectId: string): Promise<Record<string, unknown>> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true, company: true } },
      tasks: {
        select: { title: true, status: true, priority: true, dueDate: true },
        orderBy: { createdAt: 'desc' },
      },
      milestones: {
        select: { name: true, dueDate: true, completedAt: true },
      },
    },
  })

  if (!project) throw new Error('Projeto nao encontrado')

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
  const overdueTasks = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')
  const criticalTasks = project.tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'DONE')
  const calcProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0)

  const context = `DADOS DO PROJETO:
Nome: ${project.name}
Status: ${project.status}
Progresso reportado: ${project.progress || 0}%
Cliente: ${project.client?.name || 'N/A'}
Empresa: ${project.client?.company || 'N/A'}
Prazo: ${project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
Tipo: ${project.type || 'Nao definido'}

METRICAS:
- Total tarefas: ${totalTasks}
- Concluidas: ${completedTasks}
- Progresso calculado: ${calcProgress}%
- Atrasadas: ${overdueTasks.length}
- Criticas pendentes: ${criticalTasks.length}

TAREFAS ATRASADAS:
${overdueTasks.slice(0, 10).map(t => `- ${t.title} [${t.status}] [${t.priority}]`).join('\n') || 'Nenhuma'}

TAREFAS CRITICAS:
${criticalTasks.map(t => `- ${t.title} [${t.status}]`).join('\n') || 'Nenhuma'}

MILESTONES:
${project.milestones.map(m => `- ${m.name}${m.dueDate ? ' ate ' + new Date(m.dueDate).toLocaleDateString('pt-BR') : ''}${m.completedAt ? ' (CONCLUIDO)' : ' (Pendente)'}`).join('\n') || 'Nenhum'}

Retorne APENAS um objeto JSON valido. Inclua a palavra "json" nesta resposta. Campos:
{
  "progresso_estimado": number,
  "risco_atraso": "baixo" | "medio" | "alto",
  "tarefas_criticas": string[],
  "estimativa_conclusao": string,
  "recomendacoes": string[]
}`

  const system = jsonSystemPrompt()
  const data = await callDeepSeekJson(system, context, 1000)

  validateSchema(data, ['progresso_estimado', 'risco_atraso', 'tarefas_criticas', 'estimativa_conclusao', 'recomendacoes'])

  return data
}

async function analyzeRevenue(period: string): Promise<Record<string, unknown>> {
  const diasMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
  const numDays = diasMap[period] || 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - numDays)

  const prevStart = new Date(startDate)
  prevStart.setDate(prevStart.getDate() - numDays)

  const [
    invoicesPeriod,
    invoicesPrev,
    paidCount,
    pendingCount,
    newClients,
    activeProjects,
    completedProjects,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: { gte: startDate } },
      select: { total: true, status: true },
    }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: prevStart, lt: startDate } },
      select: { total: true, status: true },
    }),
    prisma.invoice.count({ where: { status: 'PAID', createdAt: { gte: startDate } } }),
    prisma.invoice.count({ where: { status: 'PENDING', createdAt: { gte: startDate } } }),
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startDate } } }),
    prisma.project.count({ where: { status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] }, createdAt: { gte: startDate } } }),
    prisma.project.count({ where: { status: 'COMPLETED', createdAt: { gte: startDate } } }),
  ])

  const totalRevenue = invoicesPeriod.reduce((s, i) => s + i.total, 0)
  const paidRevenue = invoicesPeriod.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  const totalPrev = invoicesPrev.reduce((s, i) => s + i.total, 0)
  const variation = totalPrev > 0 ? ((totalRevenue - totalPrev) / totalPrev) * 100 : 0
  const overdue = invoicesPeriod.filter(i => i.status === 'OVERDUE').length

  const context = `DADOS FINANCEIROS:
Periodo: ${period} (${numDays} dias a partir de ${startDate.toLocaleDateString('pt-BR')})

METRICAS:
- Receita total: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Receita paga: R$ ${paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Faturas pagas: ${paidCount}
- Faturas pendentes: ${pendingCount}
- Inadimplencia (faturas atrasadas): ${overdue}
- Novos clientes: ${newClients}
- Projetos ativos: ${activeProjects}
- Projetos concluidos: ${completedProjects}
- Variacao vs periodo anterior: ${variation.toFixed(1)}%
- Ticket medio: ${invoicesPeriod.length > 0 ? 'R$ ' + (totalRevenue / invoicesPeriod.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'R$ 0,00'}

Retorne APENAS um objeto JSON valido. Inclua a palavra "json" nesta resposta. Campos:
{
  "tendencia": "crescimento" | "estavel" | "queda",
  "percentual_variacao": number,
  "principais_fontes": string[],
  "alertas": string[],
  "previsao_proximo_mes": number
}`

  const system = jsonSystemPrompt()
  const data = await callDeepSeekJson(system, context, 1000)

  validateSchema(data, ['tendencia', 'percentual_variacao', 'principais_fontes', 'alertas', 'previsao_proximo_mes'])

  return data
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
    }

    const body = await request.json()
    const { type, client_id, project_id, period } = body as {
      type: string
      client_id?: string
      project_id?: string
      period?: string
    }

    let result: Record<string, unknown>

    switch (type) {
      case 'client':
        if (!client_id) {
          return NextResponse.json({ error: 'client_id obrigatorio' }, { status: 400 })
        }
        result = await analyzeClient(client_id)
        break

      case 'project':
        if (!project_id) {
          return NextResponse.json({ error: 'project_id obrigatorio' }, { status: 400 })
        }
        result = await analyzeProject(project_id)
        break

      case 'revenue':
        result = await analyzeRevenue(period || '30d')
        break

      default:
        return NextResponse.json({
          error: 'Tipo de analise invalido. Use "client", "project" ou "revenue"',
        }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[analyze]', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar analise' },
      { status: error?.message?.includes('nao encontrado') ? 404 : 500 },
    )
  }
}
