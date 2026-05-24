import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const projects = await prisma.project.findMany({
      where: { clientId: user.id, isArchived: false },
      select: { name: true, status: true, progress: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    const activeProjects = projects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length
    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length)
      : 0

    const prompt = `Você é um assistente amigável. Resuma em 1-2 frases em português (tom motivacional) o estado dos projetos deste cliente:
Projetos ativos: ${activeProjects.length} (${activeProjects.map(p => p.name).join(', ')})
Projetos concluídos: ${completedCount}
Progresso médio: ${avgProgress}%

Seja breve, positivo e útil. Não invente dados.`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ data: { summary: `${activeProjects.length} projetos ativos com progresso médio de ${avgProgress}%.` } })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const json = await res.json()
    const summary = json.content?.[0]?.text || `${activeProjects.length} projetos ativos com progresso médio de ${avgProgress}%.`

    return NextResponse.json({ data: { summary: summary.trim() } })
  } catch {
    return NextResponse.json({
      data: { summary: null },
      error: 'Erro ao gerar resumo',
    }, { status: 500 })
  }
}
