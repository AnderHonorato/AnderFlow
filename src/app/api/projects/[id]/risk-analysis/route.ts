import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const project = await prisma.project.findUnique({
    where: { id: params.id },
  })

  if (!project) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  const tasks = await prisma.task.findMany({ where: { projectId: params.id } })
  const tickets = await prisma.ticket.findMany({
    where: { status: 'OPEN' },
  })
  const payments = await prisma.payment.findMany({
    where: { invoice: { projectId: params.id } },
    include: { invoice: true },
  })

  const totalTasks = tasks.length
  const lateTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length
  const criticalTickets = tickets.filter(t => t.status === 'OPEN' && t.priority === 'CRITICAL').length
  const actualCost = payments.reduce((sum, p) => sum + p.amount, 0)
  const daysRemaining = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000)
    : null

  const prompt = `Analise os riscos deste projeto de software:
- Progresso: ${project.progress || 0}%
- Tarefas atrasadas: ${lateTasks} de ${totalTasks}
- Tickets críticos abertos: ${criticalTickets}
- Orçamento: R$${project.budget || 0} (estimado) / R$${actualCost} (realizado)
- Prazo: ${daysRemaining !== null ? daysRemaining + ' dias restantes' : 'Não definido'}
- Status: ${project.status}

Identifique os principais riscos e ações mitigadoras. Responda em JSON:
{ risks: [{level: 'critical'|'high'|'medium'|'low', category: string, description: string, mitigation: string}], overallRisk: 'critical'|'high'|'medium'|'low' }`

  try {
    const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Você é um analista de riscos de projetos. Responda somente com JSON válido.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!aiRes.ok) {
      const errorText = await aiRes.text()
      console.error('[risk-analysis] DeepSeek error:', errorText)
      return NextResponse.json({ error: 'Erro ao chamar IA' }, { status: 502 })
    }

    const aiJson = await aiRes.json()
    const rawContent = aiJson.choices?.[0]?.message?.content || '{}'
    let analysis: any
    try {
      analysis = JSON.parse(rawContent.replace(/```json|```/g, '').trim())
    } catch {
      analysis = { risks: [], overallRisk: 'medium' }
    }

    const currentStepsData = project.stepsData || '{}'
    let metadata: any = {}
    try { metadata = JSON.parse(currentStepsData) } catch {}
    if (typeof metadata !== 'object' || Array.isArray(metadata)) metadata = {}
    metadata.riskAnalysis = analysis
    metadata.riskAnalysisAt = new Date().toISOString()

    await prisma.project.update({
      where: { id: params.id },
      data: { stepsData: JSON.stringify(metadata) },
    })

    return NextResponse.json({ data: analysis })
  } catch (err) {
    console.error('[risk-analysis]', err)
    return NextResponse.json({ error: 'Erro ao processar análise' }, { status: 500 })
  }
}
