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

    const { project_id } = await request.json()
    if (!project_id) {
      return NextResponse.json({ error: 'project_id obrigatorio' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: {
        client: { select: { name: true, company: true } },
        tasks: {
          select: { title: true, status: true, priority: true, dueDate: true },
          orderBy: { createdAt: 'desc' },
        },
        milestones: {
          select: { name: true, dueDate: true, completedAt: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto nao encontrado' }, { status: 404 })
    }

    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
    const overdueTasks = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')
    const criticalTasks = project.tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'DONE')
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0

    const contextData = `DADOS DO PROJETO:
Nome: ${project.name}
Status: ${project.status}
Progresso reportado: ${project.progress || 0}%
Cliente: ${project.client?.name || 'N/A'}
Empresa: ${project.client?.company || 'N/A'}
Prazo: ${project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
Tipo: ${project.type}

MÉTRICAS:
- Total de tarefas: ${totalTasks}
- Tarefas concluidas: ${completedTasks}
- Progresso calculado: ${progress}%
- Tarefas atrasadas: ${overdueTasks.length}
- Tarefas criticas pendentes: ${criticalTasks.length}

TAREFAS ATRASADAS:
${overdueTasks.slice(0, 10).map(t => `- ${t.title} [${t.status}] [${t.priority}]`).join('\n') || 'Nenhuma'}

TAREFAS CRITICAS PENDENTES:
${criticalTasks.map(t => `- ${t.title} [${t.status}]`).join('\n') || 'Nenhuma'}

MILESTONES:
${project.milestones.map(m => `- ${m.name}${m.dueDate ? ' - Prazo: ' + new Date(m.dueDate).toLocaleDateString('pt-BR') : ''}${m.completedAt ? ' - CONCLUIDO' : ' - Pendente'}`).join('\n') || 'Nenhum'}

ANALISE e retorne EXATAMENTE um JSON com os campos abaixo. Inclua a palavra "json" nesta resposta:
{
  "progresso_estimado": number,
  "risco_atraso": "baixo" | "medio" | "alto",
  "tarefas_criticas": string[],
  "estimativa_conclusao": string,
  "recomendacoes": string[]
}`

    const messages: ChatMessage[] = [
      { role: 'system', content: `${getSystemPrompt('ASSISTENTE_GERAL')}\n\nIMPORTANTE: Retorne APENAS JSON valido, sem markdown, sem explicacoes adicionais.` },
      { role: 'user', content: contextData },
    ]

    const { data } = await chatJson(messages, { maxTokens: 1000, model: process.env.DEEPSEEK_MODEL })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[analyze/project]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao analisar projeto' }, { status: 500 })
  }
}
