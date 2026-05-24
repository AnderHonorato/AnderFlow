import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { projectId } = await request.json()
    if (!projectId) return NextResponse.json({ error: 'projectId e obrigatorio' }, { status: 400 })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: { select: { name: true, company: true, email: true } } },
    })

    if (!project) return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })

    const prompt = `Gere um contrato de prestacao de servicos de desenvolvimento de software em portugues brasileiro para:

Contratante: ${project.client.company || project.client.name} (Cliente)
Contratada: ANDERFLOW Sistemas
Projeto: ${project.name} — ${project.description || 'Desenvolvimento de software'}
Valor: R$ ${(project.proposalValue || project.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Prazo: ${project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'A definir'}

Inclua: objeto, prazo, valor e forma de pagamento, obrigacoes das partes, propriedade intelectual, confidencialidade, rescicao, foro.
Seja profissional mas conciso. Use linguagem juridica apropriada.`

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.5,
      }),
    })

    const aiJson = await aiResponse.json()
    const contractContent = aiJson.choices?.[0]?.message?.content || 'Erro ao gerar contrato. Tente novamente.'

    return NextResponse.json({ contractContent })
  } catch (error) {
    console.error('[generate-contract] Error:', error)
    return NextResponse.json({ error: 'Erro ao gerar contrato' }, { status: 500 })
  }
}
