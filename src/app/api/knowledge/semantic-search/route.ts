import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { chat } from '@/lib/deepseek'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({ query: z.string().min(1).max(500) })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Query invalida' }, { status: 400 })

    const { query } = parsed.data

    const articles = await prisma.knowledgeBase.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, content: true, category: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    if (articles.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const articlePreviews = articles.map(a => ({
      id: a.id,
      title: a.title,
      preview: (a.content || '').slice(0, 300),
      category: a.category,
    }))

    const prompt = `Dado estes artigos de knowledge base, qual e o mais relevante para a pergunta: '${query}'? 
Responda com os IDs dos artigos mais relevantes em ordem de relevancia, maximo 5. 
Para cada resultado, atribua um score de relevancia de 0 a 100.

Artigos:
${JSON.stringify(articlePreviews)}

Responda APENAS com JSON valido: { "results": [{ "id": "article_id", "score": 95 }, ...] }`

    const { content } = await chat([
      { role: 'system', content: 'Voce e um assistente que responde apenas com JSON valido. Nao inclua explicacoes ou markdown.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, maxTokens: 1000 })

    let parsedResults: { results: { id: string; score: number }[] }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsedResults = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [] }
    } catch {
      return NextResponse.json({ data: [] })
    }

    const resultIds = new Set((parsedResults.results || []).map(r => r.id))
    const scoreMap = new Map((parsedResults.results || []).map(r => [r.id, r.score]))

    const fullArticles = articles
      .filter(a => resultIds.has(a.id))
      .map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        score: scoreMap.get(a.id) || 0,
      }))
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ data: fullArticles })
  } catch (error: any) {
    console.error('[semantic-search]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro na busca semantica' }, { status: 500 })
  }
}
