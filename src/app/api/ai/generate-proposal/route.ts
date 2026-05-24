import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { projectId } = await request.json()
    if (!projectId) {
      return NextResponse.json({ error: 'projectId obrigatorio' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { name: true, company: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })
    }

    const briefingData = (() => {
      try { return project.briefing ? JSON.parse(project.briefing) : null } catch { return null }
    })()

    let briefingText = ''
    if (briefingData) {
      const answers = briefingData.answers || briefingData
      const template = briefingData.template
      if (template?.stages) {
        for (const stage of template.stages) {
          briefingText += `\n--- ${stage.title || stage.label} ---\n`
          for (const q of stage.questions || []) {
            const value = answers[q.id]
            const display = Array.isArray(value) ? value.join(', ') : (typeof value === 'string' ? value : JSON.stringify(value))
            briefingText += `${q.label}: ${display}\n`
          }
        }
      } else {
        for (const [key, value] of Object.entries(answers)) {
          briefingText += `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`
        }
      }
      if (briefingData.summary) {
        briefingText += `\nResumo: ${briefingData.summary}\n`
      }
    }

    const userPrompt = `Gere uma proposta comercial profissional para o seguinte projeto:

Nome do Projeto: ${project.name}
Descricao: ${project.description || 'Nao informada'}
Cliente: ${project.client?.name || 'Nao informado'}
Empresa do cliente: ${project.client?.company || 'Nao informada'}
${briefingText ? `Dados do Briefing:\n${briefingText}` : ''}

A proposta deve incluir:
1. Apresentacao da ANDERFLOW Sistemas
2. Entendimento do projeto e escopo
3. Metodologia e etapas
4. Cronograma estimado
5. Investimento sugerido (valor em R$)
6. Diferenciais e garantias
7. Proximos passos

Use linguagem profissional mas acessivel. Destaque pontos do briefing se disponiveis.
No final, inclua uma linha separada EXATAMENTE no formato: VALOR_SUGERIDO: XXXX (onde XXXX e o valor numerico em reais, ex: 5000)`

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY nao configurada' }, { status: 500 })
    }

    let aiProposal = ''
    let suggestedValue = ''

    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 800,
          temperature: 0.4,
          messages: [
            { role: 'system', content: 'Voce e um assistente para um desenvolvedor freelancer. Gere uma proposta comercial profissional em portugues brasileiro. Use markdown para formatacao.' },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('DeepSeek API error:', errText)
        return NextResponse.json({ error: 'Erro na API de IA' }, { status: 500 })
      }

      const json = await res.json()
      aiProposal = json.choices?.[0]?.message?.content || ''

      const valorMatch = aiProposal.match(/VALOR_SUGERIDO:\s*(\d+)/i)
      if (valorMatch) {
        suggestedValue = valorMatch[1]
        aiProposal = aiProposal.replace(/VALOR_SUGERIDO:\s*\d+/i, '').trim()
      }
    } catch (err: any) {
      console.error('AI error:', err)
      return NextResponse.json({ error: 'Erro ao chamar IA' }, { status: 500 })
    }

    return NextResponse.json({ proposal: aiProposal, suggestedValue })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
