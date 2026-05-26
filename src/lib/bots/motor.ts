// ============================================
// MOTOR DE BOTS — Orquestrador de bots autônomos via IA
// Cada bot age independentemente, usando o papel (role) que possui.
// Dependências entre papéis são resolvidas por timeout.
// ============================================

import { prisma } from '@/lib/prisma'
import { cargoParaNivel } from '@/lib/hierarquia'

let engineInterval: ReturnType<typeof setInterval> | null = null
let currentIntervalMs = 10000
const PROCESSING = new Set<string>()

export function startBotEngine(intervalMs?: number) {
  if (engineInterval) {
    if (intervalMs && intervalMs !== currentIntervalMs) {
      stopBotEngine()
    } else {
      return
    }
  }
  currentIntervalMs = intervalMs || 10000
  console.log(`[BOTS] Engine iniciada (intervalo: ${currentIntervalMs}ms)`)

  engineInterval = setInterval(async () => {
    try {
      const bots = await prisma.user.findMany({
        where: { isBot: true, botStatus: 'ACTIVE', isActive: true },
        select: { id: true, name: true, email: true, role: true, botContext: true, botLastActionAt: true },
      })

      for (const bot of bots) {
        if (PROCESSING.has(bot.id)) continue
        PROCESSING.add(bot.id)
        processBotStep(bot).finally(() => PROCESSING.delete(bot.id))
      }
    } catch (e) {
      // engine silenciosa
    }
  }, currentIntervalMs)
}

export function stopBotEngine() {
  if (engineInterval) {
    clearInterval(engineInterval)
    engineInterval = null
    console.log('[BOTS] Engine parada')
  }
}

export async function getBotConfig(): Promise<{ intervalMs: number; activeBotIds: string[] }> {
  try {
    const pref = await prisma.userPreference.findFirst({
      where: {
        user: { role: 'OWNER', isBot: false, isActive: true },
      },
    })
    const prefs = (pref?.preferences || {}) as Record<string, any>
    return {
      intervalMs: prefs.botIntervalMs || 10000,
      activeBotIds: prefs.botActiveIds || [],
    }
  } catch {
    return { intervalMs: 10000, activeBotIds: [] }
  }
}

export async function processBotStep(bot: {
  id: string; name: string; email: string; role: string; botContext: string | null; botLastActionAt: Date | null
}) {
  const ctx = parseContext(bot.botContext)

  // Se tem dependência pendente, verificar se foi resolvida
  if (ctx.pendingDependency) {
    const resolved = await checkDependency(ctx.pendingDependency, bot.role)
    if (!resolved) {
      const waited = Date.now() - new Date(ctx.pendingDependency.since).getTime()
      if (waited > 120000) {
        ctx.pendingDependency = null
        ctx.actions.push({ time: new Date().toISOString(), action: 'DEPENDENCY_TIMEOUT', note: 'Timeout de espera — pulando' })
      } else {
        return // continua esperando
      }
    } else {
      ctx.actions.push({ time: new Date().toISOString(), action: 'DEPENDENCY_RESOLVED', note: ctx.pendingDependency.description })
      ctx.pendingDependency = null
    }
  }

  // Coleta snapshot completo do sistema para contexto da IA
  const systemSnapshot = await collectSystemSnapshot()
  const state = await collectBotState(bot.id, bot.role)

  // Monta prompt para IA
  const prompt = buildBotPrompt(bot, ctx, state, systemSnapshot)

  // Cria registro de ação como "pending" no banco
  const actionLog = await saveActionLog({
    botId: bot.id,
    botName: bot.name,
    botRole: bot.role,
    action: 'Decidindo próxima ação...',
    status: 'pending',
    prompt,
  })

  // Chama IA para decidir próximo passo
  let aiResponse: {
    action: string; endpoint: string; method: string; body: any; needsApproval: string | null;
    tokensUsed?: number; fullResponse?: string;
  } | null = null

  try {
    aiResponse = await callBotAI(prompt)

    if (!aiResponse) {
      await updateActionLog(actionLog.id, {
        action: 'IA não retornou resposta',
        status: 'error',
        error: 'Sem resposta da IA — API key pode estar ausente ou houve falha na chamada',
      })
      await prisma.user.update({ where: { id: bot.id }, data: { botLastActionAt: new Date() } })
      return
    }

    // Atualiza log com ação decidida pela IA
    await updateActionLog(actionLog.id, {
      action: aiResponse.action,
      endpoint: aiResponse.endpoint,
      method: aiResponse.method,
      requestBody: aiResponse.body,
      aiResponse: aiResponse.fullResponse || null,
      tokensUsed: aiResponse.tokensUsed || null,
      costEstimate: aiResponse.tokensUsed ? estimateCost(aiResponse.tokensUsed) : null,
      status: 'running',
    })
  } catch (err: any) {
    await updateActionLog(actionLog.id, {
      action: 'Erro ao chamar IA',
      status: 'error',
      error: err?.message || 'Erro desconhecido na chamada da IA',
    })
    return
  }

  // Executa a ação
  try {
    const result = await executeAction(bot.id, aiResponse, ctx, bot.role)

    await updateActionLog(actionLog.id, {
      status: 'success',
      result,
    })

    ctx.actions.push({ time: new Date().toISOString(), action: aiResponse.action, result })
    ctx.state = state

    if (aiResponse.needsApproval) {
      ctx.pendingDependency = {
        type: aiResponse.needsApproval,
        description: aiResponse.action,
        since: new Date().toISOString(),
      }
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Erro desconhecido'

    await updateActionLog(actionLog.id, {
      status: 'error',
      error: errorMsg,
    })

    ctx.actions.push({ time: new Date().toISOString(), action: 'ERROR', error: errorMsg })
  }

  // Salva contexto atualizado
  await prisma.user.update({
    where: { id: bot.id },
    data: {
      botContext: JSON.stringify(ctx),
      botLastActionAt: new Date(),
    },
  })
}

function parseContext(raw: string | null): BotContext {
  if (!raw) return { startedAt: null, actions: [], pendingDependency: null, state: {} }
  try { return JSON.parse(raw) } catch { return { startedAt: null, actions: [], pendingDependency: null, state: {} } }
}

interface BotContext {
  startedAt: string | null
  actions: { time: string; action: string; result?: any; error?: string; note?: string }[]
  pendingDependency: { type: string; description: string; since: string } | null
  state: Record<string, any>
}

async function checkDependency(dep: { type: string; description: string; since: string }, _botRole: string): Promise<boolean> {
  if (dep.type === 'OWNER_APPROVAL') {
    const owner = await prisma.user.findFirst({ where: { role: 'OWNER', isBot: false, isActive: true } })
    return !!owner
  }
  if (dep.type === 'ADMIN_ACTION') {
    const adminActivity = await prisma.activity.findFirst({
      where: { createdAt: { gte: new Date(dep.since) } },
      orderBy: { createdAt: 'desc' },
    })
    return !!adminActivity
  }
  return true
}

// ============================================
// PERSISTÊNCIA NO BANCO
// ============================================

async function saveActionLog(data: {
  botId: string; botName: string; botRole: string; action: string;
  endpoint?: string; method?: string; requestBody?: any;
  status: string; result?: string; error?: string;
  prompt?: string; aiResponse?: string; tokensUsed?: number; costEstimate?: number;
}) {
  try {
    const log = await (prisma as any).botActionLog.create({ data })
    return log as { id: string }
  } catch {
    return { id: 'offline-' + Date.now() }
  }
}

async function updateActionLog(id: string, data: Record<string, any>) {
  if (id.startsWith('offline-')) return
  try {
    await (prisma as any).botActionLog.update({ where: { id }, data })
  } catch {
    // log offline — não interrompe o fluxo
  }
}

function estimateCost(tokens: number): number {
  // deepseek-chat: ~$0.14/1M input tokens, ~$0.28/1M output tokens
  // média aproximada de $0.20/1M tokens
  return Math.round(tokens / 1_000_000 * 0.20 * 10000) / 10000
}

// ============================================
// SNAPSHOT DO SISTEMA — coleta dados reais do site para contexto da IA
// ============================================

async function collectSystemSnapshot(): Promise<SystemSnapshot> {
  try {
    const [
      projects,
      recentProjects,
      pendingProjects,
      tickets,
      openTickets,
      invoices,
      pendingInvoices,
      contracts,
      activeContracts,
      tasks,
      pendingTasks,
      leads,
      users,
      clients,
      recentMessages,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, status: true, clientId: true, client: { select: { name: true } } } }),
      prisma.project.count({ where: { status: { in: ['DRAFT', 'PENDING', 'PENDING_APPROVAL'] } } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.lead.count(),
      prisma.user.count({ where: { isActive: true, isBot: false } }),
      prisma.user.findMany({ where: { role: 'CLIENT', isActive: true, isBot: false }, take: 5, select: { id: true, name: true, company: true } }),
      prisma.message.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { type: true, content: true } }),
    ])

    return {
      projects,
      recentProjects: recentProjects.map(p => ({ name: p.name, status: p.status, client: p.client?.name || 'N/A' })),
      pendingProjects,
      tickets,
      openTickets,
      invoices,
      pendingInvoices,
      contracts,
      activeContracts,
      tasks,
      pendingTasks,
      leads,
      users,
      clients: clients.map(c => ({ id: c.id, name: c.name, company: c.company })),
      recentMessages: recentMessages.map(m => `${m.type}: ${m.content?.slice(0, 60)}`),
      timestamp: new Date().toISOString(),
    }
  } catch {
    return { projects: 0, recentProjects: [], pendingProjects: 0, tickets: 0, openTickets: 0, invoices: 0, pendingInvoices: 0, contracts: 0, activeContracts: 0, tasks: 0, pendingTasks: 0, leads: 0, users: 0, clients: [], recentMessages: [], timestamp: new Date().toISOString() }
  }
}

interface SystemSnapshot {
  projects: number
  recentProjects: { name: string; status: string; client: string }[]
  pendingProjects: number
  tickets: number
  openTickets: number
  invoices: number
  pendingInvoices: number
  contracts: number
  activeContracts: number
  tasks: number
  pendingTasks: number
  leads: number
  users: number
  clients: { id: string; name: string; company: string | null }[]
  recentMessages: string[]
  timestamp: string
}

async function collectBotState(botId: string, role: string): Promise<Record<string, any>> {
  const isClient = cargoParaNivel(role) < 40
  const [projects, tasks, invoices, contracts, tickets, leads, messages] = await Promise.all([
    prisma.project.count({ where: isClient ? { clientId: botId } : {} }),
    prisma.task.count({ where: isClient ? { project: { clientId: botId } } : {} }),
    prisma.invoice.count({ where: isClient ? { clientId: botId } : {} }),
    prisma.contract.count({ where: isClient ? { clientId: botId } : {} }),
    prisma.ticket.count({ where: isClient ? { creatorId: botId } : {} }),
    prisma.lead.count(),
    prisma.message.count({ where: isClient ? { senderId: botId } : {} }),
  ])
  return { projects, tasks, invoices, contracts, tickets, leads, messages, botId }
}

function buildBotPrompt(bot: any, ctx: BotContext, state: Record<string, any>, snapshot: SystemSnapshot): string {
  const recentActions = ctx.actions.slice(-10).map(a => `- ${a.time}: ${a.action}`).join('\n')
  const features = getFeaturesForRole(bot.role)

  const projetosRecentes = snapshot.recentProjects.map(p => `  - "${p.name}" (${p.status}) — cliente: ${p.client}`).join('\n')
  const clientesDisponiveis = snapshot.clients.map(c => `  - ${c.name} (${c.company || 'sem empresa'}) [${c.id}]`).join('\n')

  return `Você é "${bot.name}" (${bot.email}), um bot de teste autônomo com papel "${bot.role}" na plataforma ANDERFLOW Sistemas.

Seu objetivo: testar todas as funcionalidades disponíveis para seu papel, simulando um usuário real. Preencha dados realistas em português brasileiro. Navegue pelas funcionalidades como se fosse um humano usando o sistema.

SNAPSHOT DO SISTEMA (atualizado em ${snapshot.timestamp}):
- Total projetos: ${snapshot.projects} | Pendentes: ${snapshot.pendingProjects}
- Total tickets: ${snapshot.tickets} | Abertos: ${snapshot.openTickets}
- Total faturas: ${snapshot.invoices} | Pendentes: ${snapshot.pendingInvoices}
- Total contratos: ${snapshot.contracts} | Ativos: ${snapshot.activeContracts}
- Total tarefas: ${snapshot.tasks} | Pendentes: ${snapshot.pendingTasks}
- Leads: ${snapshot.leads} | Usuários ativos: ${snapshot.users}

PROJETOS RECENTES:
${projetosRecentes || '  (nenhum projeto)'}

CLIENTES DISPONÍVEIS:
${clientesDisponiveis || '  (nenhum cliente)'}

MENSAGENS RECENTES: ${snapshot.recentMessages.join(', ') || 'nenhuma'}

SEU ESTADO:
- Projetos: ${state.projects} | Tarefas: ${state.tasks} | Faturas: ${state.invoices}
- Contratos: ${state.contracts} | Tickets: ${state.tickets} | Leads: ${state.leads} | Mensagens: ${state.messages}

ÚLTIMAS 10 AÇÕES (não repita):
${recentActions || '(nenhuma ação ainda)'}

FUNCIONALIDADES DISPONÍVEIS PARA "${bot.role}":
${features}

DEPENDÊNCIA PENDENTE: ${ctx.pendingDependency ? `Aguardando: ${ctx.pendingDependency.type} — ${ctx.pendingDependency.description}` : 'Nenhuma'}

INSTRUÇÕES:
1. Escolha UMA ação para executar agora.
2. Priorize ações que ainda não foram feitas (veja histórico e estado).
3. Use dados realistas em português brasileiro (nomes de empresa, descrições, valores).
4. Use IDs reais de clientes/projetos listados acima quando relevante.
5. Se não houver projetos, crie um novo. Se houver projetos pendentes, aprove/responda.
6. Varie as ações: não repita o mesmo tipo de ação consecutivamente.
7. Se a ação depende de Owner/Admin e você não tem esse papel, marque needsApproval.

Responda EXATAMENTE no formato JSON (sem markdown, sem explicacoes):
{
  "action": "descricao curta do que vai fazer",
  "endpoint": "/api/...",
  "method": "POST",
  "body": { ... },
  "needsApproval": "OWNER_APPROVAL" ou null
}`
}

function getFeaturesForRole(role: string): string {
  const all: Record<string, string> = {
    OWNER: `
- Gerenciar usuários (criar, editar, banir) — POST /api/users
- Ver analytics — GET /api/analytics/online
- Gerenciar API keys — POST /api/admin/api-keys
- Ativar/desativar bots — POST /api/bots/toggle
- Criar projetos (completo) — POST /api/projects
- Gerenciar faturas — POST /api/invoices
- Gerenciar contratos — POST /api/contracts
- Ver dashboard geral — GET /api/dashboard
- Aprovar projetos pendentes — POST /api/projects/{id}/approve
- Gerenciar leads — POST /api/leads`,
    ADMIN: `
- Criar projetos — POST /api/projects
- Aprovar projetos pendentes — POST /api/projects/{id}/approve
- Gerenciar tarefas — POST /api/tasks
- Gerenciar faturas — POST /api/invoices
- Gerenciar contratos — POST /api/contracts
- Gerenciar tickets — POST /api/tickets
- Enviar atualizações de projeto — POST /api/project-updates
- Ver todos os clientes — GET /api/clients
- Gerenciar leads — POST /api/leads`,
    MODERATOR: `
- Gerenciar projetos — POST /api/projects
- Gerenciar chat — POST /api/messages
- Gerenciar tickets — POST /api/tickets
- Gerenciar base de conhecimento — POST /api/knowledge
- Gerenciar clientes — GET /api/clients
- Gerenciar tarefas — POST /api/tasks`,
    DEVELOPER: `
- Gerenciar projetos — POST /api/projects
- Gerenciar tarefas — POST /api/tasks (criar, mover status)
- Atualizar progresso de tarefas — PATCH /api/tasks
- Registrar horas — POST /api/time-entries
- Comentar em projetos — POST /api/messages
- Gerenciar tickets técnicos — POST /api/tickets`,
    CLIENT: `
- Criar solicitação de projeto — POST /api/projects (status DRAFT)
- Responder proposta — POST /api/projects/{id}/respond
- Assinar contrato — POST /api/contracts/{id}/sign
- Enviar mensagens — POST /api/messages
- Ver projetos no portal — GET /api/projects (filtrado)
- Abrir tickets de suporte — POST /api/tickets
- Enviar feedback NPS — POST /api/nps`,
    USER: `
- Criar solicitação de projeto — POST /api/projects
- Ver seus projetos — GET /api/projects
- Enviar mensagens — POST /api/messages
- Assinar contratos — POST /api/contracts/{id}/sign`,
  }
  return all[role] || all.USER
}

// ============================================
// CHAMADA IA — DeepSeek com timeout adequado e tracking de tokens
// ============================================

let warnedMissingKey = false

async function callBotAI(prompt: string): Promise<{
  action: string; endpoint: string; method: string; body: any; needsApproval: string | null;
  tokensUsed?: number; fullResponse?: string;
} | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.log('[BOTS] Sem DEEPSEEK_API_KEY — bots operando sem IA')
      warnedMissingKey = true
    }
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 600,
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'Voce e um orquestrador de bots de teste. Responda sempre em JSON valido, sem markdown, sem explicacoes adicionais. Use dados realistas em portugues brasileiro.' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.log(`[BOTS] DeepSeek API error ${res.status}: ${errText.slice(0, 200)}`)
      return null
    }

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const tokensUsed = json.usage?.total_tokens || undefined
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      console.log(`[BOTS] IA não retornou JSON válido: ${text.slice(0, 200)}`)
      return null
    }

    const parsed = JSON.parse(match[0])
    return {
      ...parsed,
      tokensUsed,
      fullResponse: text,
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err?.name === 'AbortError') {
      console.log('[BOTS] Timeout na chamada DeepSeek (30s)')
    }
    return null
  }
}

// ============================================
// EXECUÇÃO DA AÇÃO — chamada HTTP com timeout e tratamento de erro
// ============================================

async function executeAction(
  botId: string,
  aiResponse: { action: string; endpoint: string; method: string; body: any; needsApproval: string | null },
  _ctx: BotContext,
  role: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}${aiResponse.endpoint}`

  // Injeta o clientId/botId em ações que precisam
  const body = { ...aiResponse.body }
  if (aiResponse.endpoint.includes('/projects') && aiResponse.method === 'POST' && !body.clientId && cargoParaNivel(role) < 40) {
    body.clientId = botId
  }

  // Para actions que precisam de auth, usamos uma chave de bot
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, {
      method: aiResponse.method,
      headers,
      body: aiResponse.method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const status = res.status
    const responseBody = await res.json().catch(() => ({}))

    if (status >= 400) {
      throw new Error(`HTTP ${status}: ${JSON.stringify(responseBody).slice(0, 200)}`)
    }

    return `${aiResponse.method} ${aiResponse.endpoint} → ${status} ${JSON.stringify(responseBody).slice(0, 200)}`
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err?.name === 'AbortError') {
      throw new Error(`Timeout ao executar ${aiResponse.method} ${aiResponse.endpoint} (30s)`)
    }
    throw err
  }
}
