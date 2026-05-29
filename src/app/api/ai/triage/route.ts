import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { getSystemPrompt } from '@/lib/ai-system-prompts'
import { AI_CONFIG } from '@/lib/ai-config'

const DEEPSEEK_URL = `${AI_CONFIG.deepseek.baseUrl}/chat/completions`

const PRIORITY_MAP: Record<string, string> = {
  baixa: 'LOW', media: 'MEDIUM', alta: 'HIGH', critica: 'CRITICAL',
}

const CATEGORY_MAP: Record<string, string> = {
  tecnico: 'TECNICO', financeiro: 'FINANCEIRO', acesso: 'ACESSO',
  bug: 'BUG', feature: 'FEATURE', outros: 'OUTROS',
}

const SENTIMENT_MAP: Record<string, string> = {
  satisfeito: 'SATISFEITO', neutro: 'NEUTRO',
  frustrado: 'FRUSTRADO', furioso: 'FURIOSO',
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error('DEEPSEEK_API_KEY nao configurada')
  return key
}

async function callDeepSeekTriage(
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  const model = AI_CONFIG.deepseek.model

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 600,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    stream: false,
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      if (attempt === 0 && (res.status === 429 || res.status === 503)) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      const err = await res.text().catch(() => '')
      console.error(`[triage] DeepSeek ${res.status}:`, err.slice(0, 300))
      throw new Error(`Erro ${res.status} na API DeepSeek`)
    }

    const data = await res.json()
    const rawContent = data?.choices?.[0]?.message?.content || ''

    try {
      return JSON.parse(rawContent)
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500))
        continue
      }
      console.error('[triage] JSON invalido:', rawContent.slice(0, 200))
      throw new Error('Falha ao gerar JSON valido para triagem')
    }
  }

  throw new Error('Maximo de tentativas excedido')
}

function tryEmitSocket(event: string, data: unknown) {
  try {
    const { io } = require('@/../server/socket')
    if (io) {
      io.emit(event, data)
    }
  } catch {
    // Socket.IO server pode estar em processo separado — ignora silenciosamente
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
    }

    const body = await request.json() as {
      ticket_id?: string
      titulo?: string
      descricao?: string
      cliente_id?: string
      historico_mensagens?: string[]
    }
    const { ticket_id, titulo: rawTitulo, descricao: rawDescricao, cliente_id, historico_mensagens } = body

    let ticketTitle = ''
    let ticketDescription = ''
    let creatorId = ''

    if (ticket_id) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticket_id },
        select: {
          id: true,
          title: true,
          description: true,
          creatorId: true,
          creator: { select: { name: true, email: true, company: true } },
        },
      })
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket nao encontrado' }, { status: 404 })
      }
      ticketTitle = ticket.title
      ticketDescription = ticket.description
      creatorId = ticket.creatorId
      if (!cliente_id) {
        body.cliente_id = ticket.creatorId
      }
    } else if (rawTitulo) {
      ticketTitle = rawTitulo
      ticketDescription = rawDescricao || ''
      if (cliente_id) creatorId = cliente_id
    } else {
      return NextResponse.json({ error: 'ticket_id ou titulo obrigatorio' }, { status: 400 })
    }

    let contextoTicket = ''

    if (body.cliente_id || creatorId) {
      const clientId = body.cliente_id || creatorId
      try {
        const [cliente, historicoTickets, historicoProjetos, historicoFaturas] = await Promise.all([
          prisma.user.findUnique({
            where: { id: clientId },
            select: { name: true, email: true, company: true, role: true, createdAt: true },
          }),
          prisma.ticket.count({ where: { creatorId: clientId } }),
          prisma.project.count({ where: { clientId } }),
          prisma.invoice.count({ where: { clientId } }),
        ])

        if (cliente) {
          contextoTicket = `
CONTEXTO DO CLIENTE:
- Nome: ${cliente.name}
- Empresa: ${cliente.company || 'N/A'}
- Email: ${cliente.email || 'N/A'}
- Cliente desde: ${cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
- Tickets anteriores: ${historicoTickets}
- Projetos ativos/historico: ${historicoProjetos}
- Faturas: ${historicoFaturas}
- Cliente VIP: ${historicoProjetos > 5 ? 'SIM (mais de 5 projetos)' : 'Nao'}`
        }
      } catch (e) {
        console.warn('[triage] Erro ao buscar contexto do cliente:', e)
      }
    }

    if (historico_mensagens?.length) {
      contextoTicket += `\n\nHISTORICO DE MENSAGENS DO TICKET:\n${historico_mensagens.join('\n')}`
    }

    const userPrompt = `Analise este ticket de suporte do ANDERFLOW Sistemas e classifique-o:

TITULO: ${ticketTitle}
DESCRICAO: ${ticketDescription}
${contextoTicket}

CLASSIFIQUE o ticket e retorne EXATAMENTE um JSON valido. A palavra "json" esta presente neste prompt para ativar o modo JSON Output. Campos obrigatorios:
{
  "prioridade": "baixa" | "media" | "alta" | "critica",
  "categoria": "tecnico" | "financeiro" | "acesso" | "bug" | "feature" | "outros",
  "sentimento_cliente": "satisfeito" | "neutro" | "frustrado" | "furioso",
  "urgencia_estimada_horas": number,
  "resumo_ia": "string max 100 caracteres resumindo o ticket",
  "acoes_sugeridas": ["acao 1", "acao 2", "acao 3"],
  "requer_escalacao": boolean
}`

    const system = `${getSystemPrompt('TRIADOR_TICKETS')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais. O sistema usa JSON Output — campos com tipos exatos.`

    const triagem = await callDeepSeekTriage(system, userPrompt)

    const prioridade = (triagem.prioridade as string) || 'media'
    const categoria = (triagem.categoria as string) || 'outros'
    const sentimento = (triagem.sentimento_cliente as string) || 'neutro'
    const urgencia = Number(triagem.urgencia_estimada_horas) || 24
    const resumo = String(triagem.resumo_ia || '').slice(0, 100)
    const acoes = Array.isArray(triagem.acoes_sugeridas) ? triagem.acoes_sugeridas.slice(0, 5) : []
    const requerEscalacao = Boolean(triagem.requer_escalacao)

    const aiPriority = PRIORITY_MAP[prioridade] || 'MEDIUM'
    const aiCategory = CATEGORY_MAP[categoria] || 'OUTROS'
    const aiSentiment = SENTIMENT_MAP[sentimento] || 'NEUTRO'

    const metadata = JSON.stringify({
      ia_triage: {
        prioridade,
        categoria,
        sentimento_cliente: sentimento,
        urgencia_estimada_horas: urgencia,
        resumo_ia: resumo,
        acoes_sugeridas: acoes,
        requer_escalacao: requerEscalacao,
        triado_em: new Date().toISOString(),
        triado_por: user.id,
      },
    })

    if (ticket_id) {
      await prisma.ticket.update({
        where: { id: ticket_id },
        data: {
          aiCategory,
          aiPriority,
          aiSuggestedReply: resumo,
          priority: aiPriority,
          category: aiCategory,
          metadata,
        },
      })
    }

    const triageResult = {
      ok: true,
      ticket_id: ticket_id || null,
      prioridade,
      categoria,
      sentimento_cliente: sentimento,
      urgencia_estimada_horas: urgencia,
      resumo_ia: resumo,
      acoes_sugeridas: acoes,
      requer_escalacao: requerEscalacao,
      aiPriority,
      aiCategory,
      aiSentiment,
    }

    tryEmitSocket('ticket:triaged', triageResult)

    return NextResponse.json(triageResult)
  } catch (error: any) {
    console.error('[triage]', error?.message || error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro ao processar triagem' },
      { status: 500 },
    )
  }
}
