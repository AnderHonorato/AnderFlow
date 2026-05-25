// ============================================
// MOTOR DE BOTS — Orquestrador de bots autônomos via IA
// Cada bot age independentemente, usando o papel (role) que possui.
// Dependências entre papéis são resolvidas por timeout.
// ============================================

import { prisma } from '@/lib/prisma'
import { cargoParaNivel } from '@/lib/hierarquia'

let engineInterval: ReturnType<typeof setInterval> | null = null
const PROCESSING = new Set<string>() // evita processar o mesmo bot simultaneamente

export function startBotEngine() {
  if (engineInterval) return
  console.log('[BOTS] Engine iniciada')

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
  }, 10000)
}

export function stopBotEngine() {
  if (engineInterval) {
    clearInterval(engineInterval)
    engineInterval = null
    console.log('[BOTS] Engine parada')
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

  // Coleta estado atual do bot
  const state = await collectBotState(bot.id, bot.role)

  // Monta prompt para IA
  const prompt = buildBotPrompt(bot, ctx, state)

  // Chama IA para decidir próximo passo
  const aiResponse = await callBotAI(prompt)

  if (!aiResponse) {
    await prisma.user.update({ where: { id: bot.id }, data: { botLastActionAt: new Date() } })
    return
  }

  // Executa a ação
  try {
    const result = await executeAction(bot.id, aiResponse, ctx, bot.role)
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
    ctx.actions.push({ time: new Date().toISOString(), action: 'ERROR', error: err?.message || 'Erro desconhecido' })
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
  // Verifica se o papel requerido já agiu
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

function buildBotPrompt(bot: any, ctx: BotContext, state: Record<string, any>): string {
  const recentActions = ctx.actions.slice(-10).map(a => `- ${a.time}: ${a.action}`).join('\n')
  const features = getFeaturesForRole(bot.role)

  return `Você é "${bot.name}" (${bot.email}), um bot de teste autônomo com papel "${bot.role}" na plataforma ANDERFLOW Sistemas.

Seu objetivo: testar todas as funcionalidades disponíveis para seu papel, preenchendo dados realistas.

ESTADO ATUAL:
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
3. Use dados realistas em português brasileiro.
4. Se a ação depende de Owner/Admin e você não tem esse papel, marque needsApproval.

Responda EXATAMENTE no formato JSON (sem markdown):
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
- Ver dashboard geral — GET /api/dashboard`,
    ADMIN: `
- Criar projetos — POST /api/projects
- Aprovar projetos pendentes — POST /api/projects/{id}/approve
- Gerenciar tarefas — POST /api/tasks
- Gerenciar faturas — POST /api/invoices
- Gerenciar contratos — POST /api/contracts
- Gerenciar tickets — POST /api/tickets
- Enviar atualizações de projeto — POST /api/project-updates
- Ver todos os clientes — GET /api/clients`,
    MODERATOR: `
- Gerenciar projetos — POST /api/projects
- Gerenciar chat — POST /api/messages
- Gerenciar tickets — POST /api/tickets
- Gerenciar base de conhecimento — POST /api/knowledge (se existir)
- Gerenciar clientes — GET /api/clients`,
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

let warnedMissingKey = false

async function callBotAI(prompt: string): Promise<{
  action: string; endpoint: string; method: string; body: any; needsApproval: string | null
} | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.log('[BOTS] Sem DEEPSEEK_API_KEY — bots operando sem IA')
      warnedMissingKey = true
    }
    return null
  }

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 400,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'Voce e um orquestrador de bots de teste. Responda sempre em JSON valido, sem markdown, sem explicacoes adicionais.' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    return JSON.parse(match[0])
  } catch {
    return null
  }
}

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

  const res = await fetch(url, {
    method: aiResponse.method,
    headers,
    body: aiResponse.method !== 'GET' ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  })

  const status = res.status
  const responseBody = await res.json().catch(() => ({}))
  return `${aiResponse.method} ${aiResponse.endpoint} → ${status} ${JSON.stringify(responseBody).slice(0, 200)}`
}
