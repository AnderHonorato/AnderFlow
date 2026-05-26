import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { chatJson } from '@/lib/deepseek'
import { getSystemPrompt } from '@/lib/ai-system-prompts'
import type { ChatMessage } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json() as { ticketId?: string; titulo?: string; descricao?: string; cliente_id?: string }
    const { ticketId, titulo: rawTitulo, descricao: rawDescricao, cliente_id } = body

    let ticketData: { title: string; description: string } = { title: '', description: '' }

    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket nao encontrado' }, { status: 404 })
      }
      ticketData = { title: ticket.title, description: ticket.description }
    } else if (rawTitulo) {
      ticketData = { title: rawTitulo, description: rawDescricao || '' }
    } else {
      return NextResponse.json({ error: 'ticketId ou titulo obrigatorio' }, { status: 400 })
    }

    let contextoTicket = ''
    if (cliente_id) {
      try {
        const [cliente, historicoTickets, historicoProjetos] = await Promise.all([
          prisma.user.findUnique({ where: { id: cliente_id }, select: { name: true, company: true, role: true } }),
          prisma.ticket.count({ where: { creatorId: cliente_id } }),
          prisma.project.count({ where: { clientId: cliente_id } }),
        ])
        if (cliente) {
          contextoTicket += `\nCONTEXTO DO CLIENTE:\n- Nome: ${cliente.name}\n- Empresa: ${cliente.company || 'N/A'}\n- Tickets anteriores: ${historicoTickets}\n- Projetos: ${historicoProjetos}`
        }
      } catch {}
    } else if (ticketId) {
      try {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { creatorId: true },
        })
        if (ticket?.creatorId) {
          const [cliente, historicoTickets] = await Promise.all([
            prisma.user.findUnique({ where: { id: ticket.creatorId }, select: { name: true, email: true, company: true } }),
            prisma.ticket.count({ where: { creatorId: ticket.creatorId } }),
          ])
          if (cliente) {
            contextoTicket += `\nCONTE�XTO DO CLIENTE:\n- Nome: ${cliente.name}\n- Empresa: ${cliente.company || 'N/A'}\n- Tickets anteriores: ${historicoTickets}`
          }
        }
      } catch {}
    }

    const userPrompt = `Analise este ticket de suporte do ANDERFLOW Sistemas e classifique-o:

TITULO: ${ticketData.title}
DESCRICAO: ${ticketData.description}
${contextoTicket}

CLASSIFIQUE o ticket e retorne EXATAMENTE um JSON com os campos abaixo. Inclua a palavra "json" nesta resposta:
{
  "prioridade": "baixa" | "media" | "alta" | "critica",
  "categoria": "tecnico" | "financeiro" | "acesso" | "bug" | "feature" | "outros",
  "sentimento_cliente": "satisfeito" | "neutro" | "frustrado" | "furioso",
  "urgencia_estimada_horas": number,
  "resumo_ia": "string max 100 caracteres resumindo o ticket",
  "acoes_sugeridas": ["acao 1", "acao 2", "acao 3"],
  "requer_escalacao": boolean
}`

    const messages: ChatMessage[] = [
      { role: 'system', content: `${getSystemPrompt('TRIADOR_TICKETS')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais.` },
      { role: 'user', content: userPrompt },
    ]

    const { data: triagem } = await chatJson<{
      prioridade: string
      categoria: string
      sentimento_cliente: string
      urgencia_estimada_horas: number
      resumo_ia: string
      acoes_sugeridas: string[]
      requer_escalacao: boolean
    }>(messages, { maxTokens: 500, model: process.env.DEEPSEEK_MODEL })

    const priorityMap: Record<string, string> = {
      baixa: 'LOW', media: 'MEDIUM', alta: 'HIGH', critica: 'CRITICAL',
    }
    const categoriaMap: Record<string, string> = {
      tecnico: 'TECNICO', financeiro: 'FINANCEIRO', acesso: 'ACESSO', bug: 'BUG', feature: 'FEATURE', outros: 'OUTROS',
    }

    const aiPriority = priorityMap[triagem.prioridade] || 'MEDIUM'
    const aiCategory = categoriaMap[triagem.categoria] || 'OUTROS'

    if (ticketId) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          aiCategory,
          aiPriority,
          aiSuggestedReply: triagem.resumo_ia,
          priority: aiPriority,
          category: aiCategory,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      prioridade: triagem.prioridade,
      categoria: triagem.categoria,
      sentimento_cliente: triagem.sentimento_cliente,
      urgencia_estimada_horas: triagem.urgencia_estimada_horas,
      resumo_ia: triagem.resumo_ia,
      acoes_sugeridas: triagem.acoes_sugeridas,
      requer_escalacao: triagem.requer_escalacao,
      aiPriority,
      aiCategory,
    })
  } catch (error: any) {
    console.error('[analyze-ticket]', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Erro ao processar triagem' }, { status: 500 })
  }
}
