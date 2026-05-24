import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { projectId, notionToken, databaseId } = await req.json()

  if (!projectId || !notionToken || !databaseId) {
    return NextResponse.json({ error: 'projectId, notionToken e databaseId são obrigatórios' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { name: true } } },
  })

  if (!project) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  try {
    const properties: any = {
      Name: { title: [{ text: { content: project.name } }] },
      Status: { select: { name: project.status } },
    }

    if (project.client?.name) {
      properties.Cliente = { rich_text: [{ text: { content: project.client.name } }] }
    }

    if (project.description) {
      properties.Descricao = { rich_text: [{ text: { content: project.description } }] }
    }

    if (project.progress !== null) {
      properties.Progresso = { number: project.progress }
    }

    const blocks: any[] = []

    if (project.description) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: project.description } }] },
      })
    }

    if (project.budget) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: `Orçamento: R$ ${project.budget}` } }] },
      })
    }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children: blocks.length > 0 ? blocks : undefined,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[notion] Error:', err)
      return NextResponse.json({ error: 'Erro ao criar página no Notion' }, { status: 502 })
    }

    const notionPage = await res.json()
    const notionPageUrl = `https://notion.so/${notionPage.id.replace(/-/g, '')}`

    return NextResponse.json({ data: { notionPageUrl, notionPageId: notionPage.id } })
  } catch (err) {
    console.error('[notion]', err)
    return NextResponse.json({ error: 'Erro ao conectar com Notion' }, { status: 500 })
  }
}
