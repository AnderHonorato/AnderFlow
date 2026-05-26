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

    const { client_id } = await request.json()
    if (!client_id) {
      return NextResponse.json({ error: 'client_id obrigatorio' }, { status: 400 })
    }

    const client = await prisma.user.findUnique({
      where: { id: client_id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        createdAt: true,
        projects: {
          select: { id: true, name: true, status: true, progress: true, deadline: true },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        invoices: {
          select: { id: true, total: true, status: true, dueDate: true, paidAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tickets: {
          select: { id: true, title: true, status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contracts: {
          select: { id: true, status: true, value: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    const projectsAtivos = client.projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length
    const projetosConcluidos = client.projects.filter(p => p.status === 'COMPLETED').length
    const totalFaturas = client.invoices.reduce((s, i) => s + i.total, 0)
    const faturasPendentes = client.invoices.filter(i => i.status === 'PENDING').length
    const faturasAtrasadas = client.invoices.filter(i => i.status === 'OVERDUE').length
    const ticketsAbertos = client.tickets.filter(t => t.status === 'OPEN').length

    const contextData = `DADOS DO CLIENTE:
Nome: ${client.name}
Email: ${client.email}
Empresa: ${client.company || 'Nao informada'}
Cliente desde: ${new Date(client.createdAt).toLocaleDateString('pt-BR')}

MÉTRICAS:
- Projetos ativos: ${projectsAtivos}
- Projetos concluidos: ${projetosConcluidos}
- Total em faturas: R$ ${totalFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Faturas pendentes: ${faturasPendentes}
- Faturas atrasadas: ${faturasAtrasadas}
- Tickets abertos: ${ticketsAbertos}
- Contratos: ${client.contracts.length}

PROJETOS RECENTES:
${client.projects.map(p => `- ${p.name} [${p.status}] ${p.progress}%${p.deadline ? ` - Prazo: ${new Date(p.deadline).toLocaleDateString('pt-BR')}` : ''}`).join('\n')}

ANALISE e retorne EXATAMENTE um JSON com os campos abaixo. Inclua a palavra "json" nesta resposta:
{
  "health_score": number 0-100,
  "status": "excelente" | "bom" | "atencao" | "risco",
  "principais_riscos": string[],
  "oportunidades": string[],
  "proxima_acao_recomendada": string,
  "sentimento_geral": "positivo" | "neutro" | "negativo"
}`

    const messages: ChatMessage[] = [
      { role: 'system', content: `${getSystemPrompt('ANALISTA_FINANCEIRO')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais.` },
      { role: 'user', content: contextData },
    ]

    const { data } = await chatJson(messages, { maxTokens: 1000, model: process.env.DEEPSEEK_MODEL })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[analyze/client]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao analisar cliente' }, { status: 500 })
  }
}
