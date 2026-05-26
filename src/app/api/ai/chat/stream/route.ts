import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { cargoEhAdmin } from '@/lib/hierarquia'
import { ICON_SYSTEM_PROMPT } from '@/components/ui/chat-icons'

const API_URL = 'https://api.deepseek.com/chat/completions'

const models: Record<string, { id: string; name: string; isPro: boolean }> = {
  'metrys-pro': { id: 'deepseek-v4-pro', name: 'Metrys v4 Pro', isPro: true },
  'metrys-flash': { id: 'deepseek-v4-flash', name: 'Metrys v4 Flash', isPro: false },
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
1. Responda APENAS sobre ANDERFLOW. Recuse assuntos externos com educacao.
2. ${isAdmin ? 'Admin: acesso TOTAL aos dados.' : 'Nao revele dados sensiveis.'}
3. Para separar topicos distintos use "---" em linha propria com MODERACAO. Cada bloco com conteudo UNICO, nao repita informacao.
4. NAO use mais que 1 icone por resposta inteira. Prefira emojis universais. NUNCA use badges (hot/novo/beta).
5. NAO invente funcionalidades. ANDERFLOW e plataforma de GESTAO DE PROJETOS DE SOFTWARE com 12 etapas.

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

async function responderComoConvidado(request: NextRequest) {
  const encoder = new TextEncoder()

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'NO_KEY', reply: 'Chave de API nao configurada.' })}\n\n`))
        ctrl.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  }

  const body = await request.json()
  const { messages, modelKey } = body as {
    messages: { role: string; content: any }[]
    modelKey?: string
  }

  if (!messages?.length) {
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'NO_MSG', reply: 'Mensagens obrigatorias.' })}\n\n`))
        ctrl.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  }

  const model = models[modelKey as keyof typeof models] || models['metrys-pro']
  let sp = buildGuestSystemPrompt()

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
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyParams),
    })

    if (!res.ok) {
      const status = res.status
      const msg = status === 402 ? 'Saldo insuficiente na API.' : status === 429 ? 'Muitas requisicoes. Aguarde.' : `Erro ${status} ao processar.`
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: `DS_${status}`, reply: msg })}\n\n`))
          ctrl.close()
        }
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
    }

    const relayStream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', choices: parsed?.choices, model: model.name })}\n\n`))
            }
          }
        } catch (e) { console.error('Guest stream read error:', e) }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', code: 'OK', model: model.name })}\n\n`))
        controller.close()
      }
    })

    return new Response(relayStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (e) {
    console.error('Guest AI error:', e)
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'INTERNAL', reply: 'Erro interno.' })}\n\n`))
        ctrl.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)

    // Usuario nao logado: responde como convidado, sem acesso a dados privados
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

    if (!messages?.length) return new Response(JSON.stringify({ error: 'Mensagens obrigatorias' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    // Auto-cria conversa se nao foi fornecida
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
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'NO_KEY', reply: 'Chave de API nao configurada.' })}\n\n`))
          ctrl.close()
        }
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
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
        const uc = await prisma.user.count(); const pc = await prisma.project.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } })
        sp += `\nStats: ${uc} usuarios, ${pc} projetos ativos.`
      } catch {}
    }
    if (projectId) {
      try {
        const p = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, status: true, progress: true, type: true, description: true, deadline: true, budget: true, client: { select: { name: true } } } })
        if (p) sp += `\nProjeto: ${p.name} [${p.status}] ${p.progress}% | ${p.client?.name || ''} | ${p.deadline ? 'Prazo: '+new Date(p.deadline).toLocaleDateString('pt-BR') : ''}`
      } catch {}
    }
    if (files?.length) {
      sp += '\nArquivos: ' + files.map(f => `${f.name}: ${(f.content||'').slice(0, 1500)}`).join('\n')
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

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyParams),
    })

    if (!res.ok) {
      const status = res.status
      const msg = status === 401 ? 'Erro de autenticacao. Verifique a chave API.' :
                  status === 402 ? 'Saldo insuficiente na API.' :
                  status === 429 ? 'Muitas requisicoes. Aguarde.' :
                  status >= 500 ? 'Servidor ocupado. Tente novamente.' :
                  `Erro ${status} ao processar.`
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: `DS_${status}`, reply: msg })}\n\n`))
          ctrl.close()
        }
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
    }

    const encoder = new TextEncoder()
    const lastMsg = messages[messages.length - 1]
    const lastText = typeof lastMsg?.content === 'string' ? lastMsg.content : '(imagem)'
    let fullContent = ''
    let fullReasoning = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

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
              if (delta?.content) fullContent += delta.content
              if (delta?.reasoning_content) fullReasoning += delta.reasoning_content

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', choices: parsed?.choices, model: model.name })}\n\n`))
            }
          }
        } catch (e) {
          console.error('Stream read error:', e)
        }

        if (convId && (fullContent || fullReasoning)) {
          await saveToDb(convId, lastText, fullContent, fullReasoning)
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', code: 'OK', model: model.name, conversationId: convId })}\n\n`))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (e) {
    console.error('AI stream error:', e)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'INTERNAL', reply: 'Erro interno.' })}\n\n`))
        ctrl.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  }
}
