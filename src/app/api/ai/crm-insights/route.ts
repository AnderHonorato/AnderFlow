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
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { lead_id, pipeline_stage, periodo } = await request.json()
    const periodoStr = (periodo as string) || '30d'

    const dias: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    const numDias = dias[periodoStr] || 30
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - numDias)

    const [
      leadsRecentes,
      leadsPorStatus,
      leadsConvertidos,
      totalLeads,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: { updatedAt: { gte: dataInicio } },
        select: {
          id: true, name: true, email: true, company: true,
          status: true, score: true, value: true, notes: true,
          leadScore: true, aiInsight: true, updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 30,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { updatedAt: { gte: dataInicio } },
        _count: { id: true },
        _sum: { value: true },
      }),
      prisma.lead.count({ where: { status: 'CONVERTED', convertedAt: { gte: dataInicio } } }),
      prisma.lead.count(),
    ])

    const leadsSemContato = leadsRecentes.filter(l => {
      if (!l.updatedAt) return true
      return Date.now() - new Date(l.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
    })

    const pipelineValue = leadsRecentes
      .filter(l => !['CONVERTED', 'LOST'].includes(l.status))
      .reduce((s, l) => s + (l.value || 0), 0)

    const leadsResumo = leadsRecentes.map(l =>
      `- ${l.name} (${l.company || 'sem empresa'}) | Status: ${l.status} | Score: ${l.score}/${l.leadScore || 0} | Valor: ${l.value || 'N/A'} | Atualizado: ${l.updatedAt ? new Date(l.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}`
    ).join('\n')

    const statusResumo = leadsPorStatus.map(s =>
      `- ${s.status}: ${s._count.id} leads, Valor total: R$ ${(s._sum?.value || 0).toLocaleString('pt-BR')}`
    ).join('\n')

    const userPrompt = `ANALISE DO CRM ANDERFLOW (periodo: ${periodoStr} - ultimos ${numDias} dias):

RESUMO GERAL:
- Total de leads no sistema: ${totalLeads}
- Leads no periodo: ${leadsRecentes.length}
- Leads convertidos no periodo: ${leadsConvertidos}
- Valor total do pipeline: R$ ${pipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Leads sem contato ha 7+ dias: ${leadsSemContato.length}

DISTRIBUICAO POR STATUS:
${statusResumo || 'Nao disponivel'}

LEADS RECENTES:
${leadsResumo || 'Nenhum lead no periodo'}

${lead_id ? `\nLEAD ESPECIFICO: ID=${lead_id} (analisar com mais detalhes)` : ''}
${pipeline_stage ? `\nESTAGIO: ${pipeline_stage} (analisar leads neste estagio)` : ''}

ANALISE e retorne EXATAMENTE um JSON com os campos abaixo. Inclua a palavra "json" nesta resposta:
{
  "leads_quentes": [{ "nome": string, "score": number, "probabilidade_conversao": number, "acao_recomendada": string }],
  "leads_esfriando": [{ "nome": string, "dias_sem_contato": number, "acao_recomendada": string }],
  "metricas_pipeline": { "valor_total": number, "ticket_medio": number, "taxa_conversao_estimada": number },
  "tempo_medio_estagio": string,
  "acoes_prioritarias": string[],
  "insight_resumo": string
}`

    const messages: ChatMessage[] = [
      { role: 'system', content: `${getSystemPrompt('ANALISTA_CRM')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais.` },
      { role: 'user', content: userPrompt },
    ]

    const { data } = await chatJson(messages, { maxTokens: 1500, thinking: true, model: process.env.DEEPSEEK_MODEL })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[crm-insights]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao gerar insights CRM' }, { status: 500 })
  }
}
