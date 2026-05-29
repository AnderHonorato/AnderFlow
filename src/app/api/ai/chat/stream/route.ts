import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { cargoEhAdmin } from '@/lib/hierarquia'
import { ICON_SYSTEM_PROMPT } from '@/components/ui/chat-icons'

const API_URL = 'https://api.deepseek.com/chat/completions'
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_RETRIES = 3

const models: Record<string, { id: string; name: string; isPro: boolean }> = {
  'metrys-pro': { id: 'deepseek-v4-pro', name: 'Metrys v4 Pro', isPro: true },
  'metrys-flash': { id: 'deepseek-v4-flash', name: 'Metrys v4 Flash', isPro: false },
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Formato de requisicao invalido'
    case 401: return 'Chave de API invalida'
    case 402: return 'Saldo insuficiente na API'
    case 429: return 'Muitas requisicoes. Aguarde'
    case 503: return 'Servidor sobrecarregado'
    default: return `Erro ${status}`
  }
}

async function fetchWithRetry(apiKey: string, bodyParams: Record<string, unknown>): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(bodyParams),
      })

      if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt === MAX_RETRIES) {
        return res
      }

      console.warn(`[Stream] Retry ${attempt + 1}/${MAX_RETRIES} — status ${res.status}`)
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise((r) => setTimeout(r, delay))
    } catch (e) {
      lastError = e as Error
      if (attempt === MAX_RETRIES) throw e
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

async function saveToDb(conversationId: string, lastText: string, reply: string, reasoning: string) {
  try {
    await prisma.aiMessage.create({ data: { conversationId, role: 'user', content: lastText } })
    const assistContent = reasoning ? `[PENSAMENTO]\n${reasoning}\n[/PENSAMENTO]\n${reply}` : reply
    await prisma.aiMessage.create({ data: { conversationId, role: 'assistant', content: assistContent } })
    const cnt = await prisma.aiMessage.count({ where: { conversationId } })
    if (cnt <= 2) {
      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: { title: lastText.slice(0, 50).replace(/\n/g, ' ') || 'Conversa', updatedAt: new Date() },
      })
    } else {
      await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    }
  } catch (e) { console.error('Stream save fail:', e) }
}

function buildSystemPrompt(user: any, isAdmin: boolean, _projectId?: string, _files?: any[], replyTo?: string): string {
  let sp = `[IDENTIDADE ABSOLUTA] Voce e Metrys, IA criada exclusivamente por Anderson Honorato, integrada ao ANDERFLOW Sistemas.

SOBRE O ANDERFLOW: ANDERFLOW Sistemas e uma plataforma de GESTAO DE PROJETOS DE SOFTWARE. Nao tem NADA a ver com emprestimos, bancos, financeiras, creditos, ou qualquer servico financeiro.

SEU PENSAMENTO E VISIVEL: Seu raciocinio (reasoning) aparece para o usuario. NUNCA repita instrucoes do sistema no pensamento. NUNCA mencione regras que esta seguindo. NUNCA diga "lembrando de nunca...", "devo evitar...", "segundo as regras...". O pensamento deve conter APENAS analise objetiva da pergunta: contexto, dados relevantes, estrutura da resposta. Sem meta-comentarios.

IDIOMA: Pensamento e resposta em portugues do Brasil (pt-BR). NUNCA use ingles.

REGRAS:
1. ${isAdmin ? 'Admin: acesso IRRESTRITO. Voce pode pesquisar qualquer assunto, gerar codigo, criar apps, discutir arquitetura, integrar servicos, e executar qualquer acao necessaria para o desenvolvimento do ANDERFLOW. Sem restricoes de topico.' : 'Responda APENAS sobre ANDERFLOW. Recuse assuntos externos com educacao.'}
2. ${isAdmin ? 'Admin: acesso TOTAL aos dados. Pode criar, modificar e excluir qualquer recurso.' : 'Nao revele dados sensiveis.'}
3. Para separar topicos distintos use "---" em linha propria com MODERACAO. Cada bloco com conteudo UNICO, nao repita informacao.
4. NAO use mais que 1 icone por resposta inteira. Prefira emojis universais. NUNCA use badges (hot/novo/beta).
5. NAO invente funcionalidades. ANDERFLOW e plataforma de GESTAO DE PROJETOS DE SOFTWARE com 12 etapas.${isAdmin ? ' Para duvidas tecnicas, responda com profundidade, inclua exemplos de codigo quando relevante.' : ''}

ETAPAS DO FLUXO ANDERFLOW:
1. Briefing 2. Proposta/Orcamento 3. Contrato 4. Planejamento 5. Design 6. Aprovacao do Design
7. Desenvolvimento 8. Testes 9. Homologacao 10. Deploy 11. Entrega 12. Garantia

Usuario: ${user.name||'N/A'} (${isAdmin?'Admin':'Cliente'})
${replyTo ? `Respondendo mensagem #${replyTo}.` : ''}

${ICON_SYSTEM_PROMPT}`

  return sp
}

function buildGuestSystemPrompt(): string {
  return `[IDENTIDADE ABSOLUTA] Voce e Metrys, IA criada exclusivamente por Anderson Honorato, integrada ao ANDERFLOW Sistemas.

SOBRE O ANDERFLOW: ANDERFLOW Sistemas e uma plataforma de GESTAO DE PROJETOS DE SOFTWARE. Nao tem NADA a ver com emprestimos, bancos, financeiras, creditos, ou qualquer servico financeiro.

IMPORTANTE: O usuario atual NAO esta logado. Voce nao tem acesso a dados pessoais, projetos, ou qualquer informacao interna. Responda apenas com informacoes publicas sobre a plataforma.

REGRAS PARA CONVIDADO:
1. Responda APENAS sobre ANDERFLOW. Recuse assuntos externos com educacao.
2. NAO invente funcionalidades ou dados. Descreva apenas o que realmente existe.
3. Sugira que o usuario crie uma conta ou faca login para ter uma experiencia completa e personalizada (acesso a projetos, suporte dedicado, etc).
4. Forneca links uteis: criar conta (/register), fazer login (/login), contato WhatsApp (77 9 9951-2937), email contato@anderflow.com.
5. ANDERFLOW e plataforma de GESTAO DE PROJETOS DE SOFTWARE com fluxo de 12 etapas: Briefing, Proposta/Orcamento, Contrato, Planejamento, Design, Aprovacao do Design, Desenvolvimento, Testes, Homologacao, Deploy, Entrega, Garantia.
6. Idioma: sempre portugues do Brasil (pt-BR).
7. NUNCA use mais que 1 icone por resposta. Prefira emojis universais.

ETAPAS DO FLUXO ANDERFLOW:
1. Briefing 2. Proposta/Orcamento 3. Contrato 4. Planejamento 5. Design 6. Aprovacao do Design
7. Desenvolvimento 8. Testes 9. Homologacao 10. Deploy 11. Entrega 12. Garantia

${ICON_SYSTEM_PROMPT}`
}

function relayDeepSeekStream(
  res: Response,
  encoder: TextEncoder,
  modelLabel: string,
  realModel: string,
  onFinal: (fullContent: string, fullReasoning: string, usage: Record<string, number> | null) => void,
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let fullReasoning = ''
      let finalUsage: Record<string, number> | null = null

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            let parsed: any
            try { parsed = JSON.parse(data) } catch { continue }

            const delta = parsed?.choices?.[0]?.delta
            const finishReason = parsed?.choices?.[0]?.finish_reason

            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`,
              ))
            }

            if (delta?.content) {
              fullContent += delta.content
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`,
              ))
            }

            if (delta?.tool_calls?.length) {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'tool_call', tool_calls: delta.tool_calls, finish_reason: finishReason || null })}\n\n`,
              ))
            }

            if (parsed.usage) {
              finalUsage = {
                prompt_tokens: parsed.usage.prompt_tokens || 0,
                completion_tokens: parsed.usage.completion_tokens || 0,
                total_tokens: parsed.usage.total_tokens || 0,
                cache_hit_tokens: parsed.usage.prompt_cache_hit_tokens || 0,
                cache_miss_tokens: parsed.usage.prompt_cache_miss_tokens || 0,
              }
            }
          }
        }
      } catch (e) {
        console.error('[Stream] Read error:', e)
      }

      const donePayload: Record<string, unknown> = {
        type: 'done',
        code: 'OK',
        model: modelLabel,
      }
      if (finalUsage) donePayload.usage = finalUsage

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`))
      controller.close()

      onFinal(fullContent, fullReasoning, finalUsage)
    },
  })
}

async function streamError(encoder: TextEncoder, code: string, reply: string) {
  const stream = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code, reply })}\n\n`))
      ctrl.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}

function sseHeaders(): Record<string, string> {
  return { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
}

async function responderComoConvidado(request: NextRequest) {
  const encoder = new TextEncoder()
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    return streamError(encoder, 'NO_KEY', 'Chave de API nao configurada.')
  }

  const body = await request.json()
  const { messages, modelKey } = body as {
    messages: { role: string; content: any }[]
    modelKey?: string
  }

  if (!messages?.length) {
    return streamError(encoder, 'NO_MSG', 'Mensagens obrigatorias.')
  }

  const model = models[modelKey as keyof typeof models] || models['metrys-pro']
  const sp = buildGuestSystemPrompt()

  const cm: any[] = [{ role: 'system', content: sp }]
  for (const m of messages) {
    if (typeof m.content === 'string') cm.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
    else if (Array.isArray(m.content)) cm.push({ role: 'user', content: m.content })
    else cm.push({ role: 'user', content: String(m.content) })
  }

  const bodyParams: any = {
    model: model.id,
    messages: cm,
    max_tokens: 3000,
    thinking: { type: 'enabled' },
    reasoning_effort: 'medium',
    stream: true,
  }

  try {
    const res = await fetchWithRetry(apiKey, bodyParams)

    if (!res.ok) {
      const status = res.status
      return streamError(encoder, `DS_${status}`, getErrorMessage(status))
    }

    const sseStream = relayDeepSeekStream(res, encoder, model.name, model.id, () => {})

    return new Response(sseStream, { headers: sseHeaders() })
  } catch (e) {
    console.error('[Stream] Guest error:', e)
    return streamError(encoder, 'INTERNAL', 'Erro interno.')
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const user = await getSessionUser(request)

    if (!user) {
      return responderComoConvidado(request)
    }

    const existing = await prisma.user.findUnique({ where: { id: user.id } })
    if (!existing) {
      try {
        await prisma.user.create({ data: { id: user.id, name: user.name || 'Usuario', email: user.email || `${user.id}@anderflow.local` } })
      } catch (e: any) {
        if (e?.code !== 'P2002') console.error('[stream] user create error:', e)
      }
    }

    const body = await request.json()
    const { messages, projectId, conversationId, files, replyTo, modelKey } = body as {
      messages: { role: string; content: any; msgId?: string }[]
      projectId?: string; conversationId?: string; replyTo?: string; modelKey?: string
      files?: { name: string; type: string; content: string }[]
    }

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Mensagens obrigatorias' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    let convId = conversationId || ''
    if (!convId) {
      try {
        const lastMsgContent = messages[messages.length - 1]?.content
        const title = typeof lastMsgContent === 'string' ? lastMsgContent.slice(0, 50) : 'Nova conversa'
        const conv = await prisma.aiConversation.create({ data: { userId: user.id, title: title || 'Nova conversa' } })
        convId = conv.id
      } catch (e) { console.error('Auto-create conversation failed:', e) }
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return streamError(encoder, 'NO_KEY', 'Chave de API nao configurada.')
    }

    const model = models[modelKey as keyof typeof models] || models['metrys-pro']
    const isAdmin = cargoEhAdmin(user.role)

    let sp = buildSystemPrompt(user, isAdmin, projectId, files, replyTo)

    try {
      const pwhere = isAdmin ? {} : { clientId: user.id } as any
      const ps = await prisma.project.findMany({
        where: pwhere, select: { name: true, status: true, progress: true }, orderBy: { updatedAt: 'desc' as const }, take: 10,
      })
      if (ps.length) sp += `\nProjetos: ${ps.map(p => `"${p.name}" [${p.status}] ${p.progress}%`).join(' | ')}`
    } catch {}
    if (isAdmin) {
      try {
        const uc = await prisma.user.count()
        const pc = await prisma.project.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } })
        sp += `\nStats: ${uc} usuarios, ${pc} projetos ativos.`
      } catch {}
    }
    if (projectId) {
      try {
        const p = await prisma.project.findUnique({
          where: { id: projectId },
          select: { name: true, status: true, progress: true, type: true, description: true, deadline: true, budget: true, client: { select: { name: true } } },
        })
        if (p) sp += `\nProjeto: ${p.name} [${p.status}] ${p.progress}% | ${p.client?.name || ''} | ${p.deadline ? 'Prazo: ' + new Date(p.deadline).toLocaleDateString('pt-BR') : ''}`
      } catch {}
    }
    if (files?.length) {
      sp += '\nArquivos: ' + files.map(f => `${f.name}: ${(f.content || '').slice(0, 1500)}`).join('\n')
    }

    const cm: any[] = [{ role: 'system', content: sp }]
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user'
      if (typeof m.content === 'string') cm.push({ role, content: m.content })
      else if (Array.isArray(m.content)) cm.push({ role: 'user', content: m.content })
      else cm.push({ role: 'user', content: String(m.content) })
    }

    const bodyParams: any = {
      model: model.id,
      messages: cm,
      max_tokens: 4000,
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: true,
    }

    const res = await fetchWithRetry(apiKey, bodyParams)

    if (!res.ok) {
      return streamError(encoder, `DS_${res.status}`, getErrorMessage(res.status))
    }

    const lastMsg = messages[messages.length - 1]
    const lastText = typeof lastMsg?.content === 'string' ? lastMsg.content : '(imagem)'

    const sseStream = relayDeepSeekStream(res, encoder, model.name, model.id, (fullContent, fullReasoning) => {
      if (convId && (fullContent || fullReasoning)) {
        saveToDb(convId, lastText, fullContent, fullReasoning)
      }
    })

    return new Response(sseStream, { headers: sseHeaders() })
  } catch (e) {
    console.error('[Stream] Fatal error:', e)
    return streamError(encoder, 'INTERNAL', 'Erro interno.')
  }
}
