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
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
    }

    const { period } = await request.json()
    const periodoStr = (period as string) || '30d'

    const dias: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const numDias = dias[periodoStr] || 30
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - numDias)

    const periodoAnterior = new Date(dataInicio)
    periodoAnterior.setDate(periodoAnterior.getDate() - numDias)

    const [
      invoicesPeriodo,
      invoicesAnterior,
      paidInvoices,
      pendingInvoices,
      newClients,
      activeProjects,
      completedProjects,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { createdAt: { gte: dataInicio } },
        select: { total: true, status: true },
      }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: periodoAnterior, lt: dataInicio } },
        select: { total: true, status: true },
      }),
      prisma.invoice.count({ where: { status: 'PAID', createdAt: { gte: dataInicio } } }),
      prisma.invoice.count({ where: { status: 'PENDING', createdAt: { gte: dataInicio } } }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: dataInicio } } }),
      prisma.project.count({ where: { status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] }, createdAt: { gte: dataInicio } } }),
      prisma.project.count({ where: { status: 'COMPLETED', createdAt: { gte: dataInicio } } }),
    ])

    const totalPeriodo = invoicesPeriodo.reduce((s, i) => s + i.total, 0)
    const totalPago = invoicesPeriodo.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
    const totalAnterior = invoicesAnterior.reduce((s, i) => s + i.total, 0)
    const variacao = totalAnterior > 0 ? ((totalPeriodo - totalAnterior) / totalAnterior) * 100 : 0

    const contextData = `DADOS FINANCEIROS (periodo: ${periodoStr} - ${numDias} dias a partir de ${dataInicio.toLocaleDateString('pt-BR')}):

METRICAS:
- Receita total no periodo: R$ ${totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Receita efetivamente paga: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Faturas pagas: ${paidInvoices}
- Faturas pendentes: ${pendingInvoices}
- Inadimplencia: ${invoicesPeriodo.filter(i => i.status === 'OVERDUE').length}
- Novos clientes: ${newClients}
- Projetos ativos: ${activeProjects}
- Projetos concluidos: ${completedProjects}
- Variacao vs periodo anterior: ${variacao.toFixed(1)}%
- Ticket medio: ${invoicesPeriodo.length > 0 ? (totalPeriodo / invoicesPeriodo.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0'}

ANALISE e retorne EXATAMENTE um JSON com os campos abaixo. Inclua a palavra "json" nesta resposta:
{
  "tendencia": "crescimento" | "estavel" | "queda",
  "percentual_variacao": number,
  "principais_fontes": string[],
  "alertas": string[],
  "previsao_proximo_mes": number
}`

    const messages: ChatMessage[] = [
      { role: 'system', content: `${getSystemPrompt('ANALISTA_FINANCEIRO')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais.` },
      { role: 'user', content: contextData },
    ]

    const { data } = await chatJson(messages, { maxTokens: 1000, model: process.env.DEEPSEEK_MODEL })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[analyze/revenue]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao analisar receita' }, { status: 500 })
  }
}
