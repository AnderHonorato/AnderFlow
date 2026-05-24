import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { leadId } = await request.json()
    if (!leadId) return NextResponse.json({ error: 'leadId e obrigatorio' }, { status: 400 })

    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })

    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / 86400000)
    const daysSinceContact = lead.metadata
      ? (() => { try { const m = JSON.parse(lead.metadata); return m.lastContact ? Math.floor((now.getTime() - new Date(m.lastContact).getTime()) / 86400000) : 30 } catch { return 30 } })()
      : 30

    const interactions = await prisma.activity.count({
      where: {
        userId: lead.ownerId || undefined,
        createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
      },
    })

    const prompt = `Pontue este lead de 0 a 100 baseado no potencial de conversao:
Nome: ${lead.name}, Empresa: ${lead.company || 'N/A'}, Setor: ${lead.source || 'N/A'}
Origem: ${lead.source || 'N/A'}, Valor Estimado: R$ ${(lead.value || 0).toLocaleString('pt-BR')}
Interacoes: ${interactions} interacoes em ${daysSinceCreation} dias
Ultimo contato: ${daysSinceContact} dias atras
Stage atual: ${lead.status}
Responda APENAS com JSON: { "score": number, "reasoning": "string", "suggestedAction": "string" }`

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      }),
    })

    const aiJson = await aiResponse.json()
    const rawContent = aiJson.choices?.[0]?.message?.content || ''

    let result = { score: 50, reasoning: 'Nao foi possivel analisar', suggestedAction: 'Entrar em contato' }
    try {
      result = JSON.parse(rawContent)
    } catch { /* fallback */ }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore: result.score,
        aiInsight: `${result.reasoning} | Acao: ${result.suggestedAction}`,
      },
    })

    return NextResponse.json({
      score: result.score,
      reasoning: result.reasoning,
      suggestedAction: result.suggestedAction,
    })
  } catch (error) {
    console.error('[lead-score] Error:', error)
    return NextResponse.json({ error: 'Erro ao pontuar lead' }, { status: 500 })
  }
}
