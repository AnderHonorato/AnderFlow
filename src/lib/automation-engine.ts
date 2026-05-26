// ============================================
// AUTOMATION ENGINE — Motor de automacoes inteligentes com IA
// Usa DeepSeek Tool Calls + Thinking Mode para decisoes autonomizadas
// ============================================

import { prisma } from '@/lib/prisma'
import { chatWithTools, chat } from '@/lib/deepseek'
import type { DeepSeekTool, ChatMessage } from '@/lib/deepseek'
import { executeToolCall } from '@/lib/ai-tools'

interface AutomationResult {
  success: boolean
  type: string
  message: string
  actions: string[]
}

const FOLLOWUP_TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'enviar_mensagem',
      description: 'Envia mensagem de follow-up personalizada para o cliente',
      parameters: {
        type: 'object',
        properties: {
          destino: { type: 'string', description: 'Nome, email ou ID do cliente' },
          mensagem: { type: 'string', description: 'Texto da mensagem de follow-up' },
        },
        required: ['destino', 'mensagem'],
      },
    },
  },
]

const PAYMENT_TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'enviar_alerta_pagamento',
      description: 'Envia notificacao de cobranca personalizada para o cliente',
      parameters: {
        type: 'object',
        properties: {
          cliente: { type: 'string', description: 'Nome, email ou ID do cliente' },
          valor: { type: 'number', description: 'Valor da fatura' },
          vencimento: { type: 'string', description: 'Data de vencimento' },
          tom: { type: 'string', enum: ['gentil', 'normal', 'direto'], description: 'Tom da mensagem' },
        },
        required: ['cliente', 'valor'],
      },
    },
  },
]

const TOOLS_MAP: Record<string, DeepSeekTool[]> = {
  followup: FOLLOWUP_TOOLS,
  payment: PAYMENT_TOOLS,
}

export async function runAiAutomation(
  type: 'AUTO_FOLLOWUP' | 'AUTO_PAYMENT_ALERT' | 'AUTO_PROJECT_HEALTH' | 'AUTO_ONBOARDING',
  context: Record<string, unknown>,
): Promise<AutomationResult> {
  const actions: string[] = []
  const toolCallResults: { name: string; result: string }[] = []

  try {
    switch (type) {
      case 'AUTO_FOLLOWUP': {
        const clienteId = context.clientId as string
        if (!clienteId) return { success: false, type, message: 'clientId obrigatorio', actions }

        const [cliente, ultimaMensagem] = await Promise.all([
          prisma.user.findUnique({ where: { id: clienteId }, select: { name: true, email: true, company: true } }),
          prisma.message.findFirst({
            where: { senderId: clienteId },
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true },
          }),
        ])

        if (!cliente) return { success: false, type, message: 'Cliente nao encontrado', actions }

        const systemMsg: ChatMessage = {
          role: 'system',
          content: `Voce e um assistente de relacionamento do ANDERFLOW Sistemas. O cliente "${cliente.name}" (${cliente.email}, ${cliente.company || 'sem empresa'}) esta sem contato ha 3+ dias. Analise o historico e gere uma mensagem de follow-up personalizada, amigavel e profissional. Use portugues do Brasil.`,
        }

        const userMsg: ChatMessage = {
          role: 'user',
          content: `Cliente: ${cliente.name}\nEmpresa: ${cliente.company || 'N/A'}\nUltima mensagem: ${ultimaMensagem?.content?.slice(0, 200) || 'N/A'} (${ultimaMensagem?.createdAt || 'N/A'})\n\nGere um follow-up e use a ferramenta enviar_mensagem para envia-lo.`,
        }

        const result = await chatWithTools([systemMsg, userMsg], FOLLOWUP_TOOLS, async (fn, args) => {
          actions.push(`Enviando follow-up para ${args.destino}`)
          return JSON.stringify({ enviado: true, destino: args.destino, preview: String(args.mensagem).slice(0, 100) })
        }, { thinking: true })

        toolCallResults.push(...result.toolCalls.map(tc => ({
          name: tc.function.name,
          result: result.content,
        })))

        return { success: true, type, message: result.content || 'Follow-up gerado', actions }
      }

      case 'AUTO_PAYMENT_ALERT': {
        const faturaId = context.invoiceId as string
        if (!faturaId) return { success: false, type, message: 'invoiceId obrigatorio', actions }

        const fatura = await prisma.invoice.findUnique({
          where: { id: faturaId },
          include: { client: { select: { id: true, name: true, email: true } } },
        })

        if (!fatura) return { success: false, type, message: 'Fatura nao encontrada', actions }

        const historico = await prisma.invoice.findMany({
          where: { clientId: fatura.clientId, status: 'PAID' },
          select: { paidAt: true },
          orderBy: { paidAt: 'desc' },
          take: 5,
        })

        const bomPagador = historico.length >= 3

        const systemMsg: ChatMessage = {
          role: 'system',
          content: `Voce gerencia cobrancas do ANDERFLOW Sistemas. Cliente: ${fatura.client.name}. Fatura R$${fatura.total} vence em ${fatura.dueDate ? new Date(fatura.dueDate).toLocaleDateString('pt-BR') : 'em breve'}. O cliente ${bomPagador ? 'e bom pagador (historico de pagamentos em dia)' : 'tem historico de inadimplencia'}. Use o tom apropriado.`,
        }

        const userMsg: ChatMessage = {
          role: 'user',
          content: `Fatura #${fatura.number}\nValor: R$ ${fatura.total}\nVencimento: ${fatura.dueDate || 'N/A'}\nStatus: ${fatura.status}\nCliente: ${fatura.client.name}\nBom pagador: ${bomPagador ? 'Sim' : 'Nao'}\n\nEnvie alerta de pagamento usando a ferramenta enviar_alerta_pagamento com o tom apropriado.`,
        }

        const result = await chatWithTools([systemMsg, userMsg], PAYMENT_TOOLS, async (fn, args) => {
          actions.push(`Alerta de pagamento para ${fatura.client.name} (R$ ${fatura.total})`)
          return JSON.stringify({ enviado: true, fatura: fatura.number, valor: fatura.total })
        }, { thinking: true })

        toolCallResults.push(...result.toolCalls.map(tc => ({
          name: tc.function.name,
          result: result.content,
        })))

        return { success: true, type, message: result.content || 'Alerta gerado', actions }
      }

      case 'AUTO_PROJECT_HEALTH': {
        const projetoId = context.projectId as string
        if (!projetoId) return { success: false, type, message: 'projectId obrigatorio', actions }

        const projeto = await prisma.project.findUnique({
          where: { id: projetoId },
          include: {
            client: { select: { name: true } },
            tasks: {
              where: { status: { not: 'DONE' }, dueDate: { lt: new Date() } },
              select: { title: true, priority: true },
              take: 10,
            },
          },
        })

        if (!projeto) return { success: false, type, message: 'Projeto nao encontrado', actions }

        const tarefasAtrasadas = projeto.tasks.length

        const messages: ChatMessage[] = [
          { role: 'system', content: 'Voce e um gerente de projetos do ANDERFLOW Sistemas. Analise projetos com tarefas atrasadas e gere um relatorio de risco e recomendacoes. Seja direto e orientado a acoes. Portugues do Brasil.' },
          { role: 'user', content: `Projeto: ${projeto.name}\nStatus: ${projeto.status}\nProgresso: ${projeto.progress}%\nTarefas atrasadas: ${tarefasAtrasadas}\n${projeto.tasks.map(t => `- ${t.title} [${t.priority}]`).join('\n')}\nPrazo final: ${projeto.deadline || 'Nao definido'}\n\nGere um relatorio de saude do projeto com: risco, impacto, e proximas acoes recomendadas. Maximo 300 palavras.` },
        ]

        const result = await chat(messages, { thinking: true, maxTokens: 500 })
        actions.push(`Analise de saude do projeto ${projeto.name} (${tarefasAtrasadas} tarefas atrasadas)`)

        return { success: true, type, message: result.content, actions }
      }

      case 'AUTO_ONBOARDING': {
        const novoClienteId = context.clientId as string
        if (!novoClienteId) return { success: false, type, message: 'clientId obrigatorio', actions }

        const cliente = await prisma.user.findUnique({
          where: { id: novoClienteId },
          select: { name: true, email: true, company: true },
        })

        if (!cliente) return { success: false, type, message: 'Cliente nao encontrado', actions }

        const messages: ChatMessage[] = [
          { role: 'system', content: 'Voce e responsavel pelo onboarding de novos clientes no ANDERFLOW Sistemas. Gere uma sequencia de onboarding personalizada baseada no perfil do cliente. Portugues do Brasil.' },
          { role: 'user', content: `Novo cliente: ${cliente.name}\nEmpresa: ${cliente.company || 'N/A'}\nEmail: ${cliente.email}\n\nSugira uma sequencia de onboarding com 3-5 etapas, incluindo: boas-vindas, tutorial da plataforma, sugestao de primeiro briefing. Seja acolhedor e profissional.` },
        ]

        const result = await chat(messages, { thinking: true, maxTokens: 600 })
        actions.push(`Sequencia de onboarding gerada para ${cliente.name}`)

        return { success: true, type, message: result.content, actions }
      }

      default:
        return { success: false, type, message: 'Tipo de automacao desconhecido', actions }
    }
  } catch (error: any) {
    console.error(`[AutomationEngine] ${type}:`, error)
    return { success: false, type, message: error?.message || 'Erro na automacao', actions }
  }
}
