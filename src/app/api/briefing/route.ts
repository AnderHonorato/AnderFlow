import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTemplateForCategory, generateSummary } from '@/lib/briefing-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const draftId = searchParams.get('draftId')

    if (draftId) {
      const draft = await prisma.briefingDraft.findUnique({
        where: { id: draftId },
        select: { id: true, categoryId: true, currentStage: true, currentStep: true, answers: true, updatedAt: true },
      })
      return NextResponse.json({ data: draft })
    }

    if (category) {
      const template = getTemplateForCategory(category)
      return NextResponse.json({ data: template })
    }

    return NextResponse.json({ error: 'Informe category ou draftId' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar briefing' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, categoryId, draftId, currentStage, currentStep, answers, action } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
    }

    if (action === 'save') {
      const draft = await prisma.briefingDraft.upsert({
        where: { id: draftId || 'new' },
        update: { currentStage, currentStep, answers: JSON.stringify(answers) },
        create: {
          id: draftId || undefined,
          userId,
          categoryId: categoryId || 'OTHER',
          currentStage: currentStage || 0,
          currentStep: currentStep || 0,
          answers: JSON.stringify(answers || {}),
        },
      })
      return NextResponse.json({ data: draft })
    }

    if (action === 'submit') {
      // Gerar resumo
      const summary = generateSummary(categoryId || 'OTHER', answers || {})

      // Criar projeto automaticamente
      const projectNumber = `PRJ-${Date.now().toString(36).toUpperCase()}`
      const project = await prisma.project.create({
        data: {
          name: answers?.project_name || 'Novo Projeto',
          slug: (answers?.project_name || 'projeto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
          description: answers?.description || summary,
          type: categoryId || 'CUSTOM',
          clientId: userId,
          status: 'DRAFT',
          priority: answers?.priority === 'Crítica' ? 'URGENT' : answers?.priority === 'Alta' ? 'HIGH' : answers?.priority === 'Baixa' ? 'LOW' : 'MEDIUM',
          tags: JSON.stringify([categoryId]),
          briefing: JSON.stringify(answers),
          budget: answers?.budget ? parseBudget(answers.budget) : null,
          deadline: answers?.deadline ? parseDeadline(answers.deadline) : null,
        },
        include: { client: { select: { id: true, name: true } } },
      })

      // Atualizar draft como submetido
      if (draftId) {
        await prisma.briefingDraft.update({
          where: { id: draftId },
          data: { submitted: true, projectId: project.id },
        })
      }

      // Notificar admin
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PROJECT_UPDATE',
            title: 'Novo projeto recebido!',
            message: `${answers?.project_name || 'Novo projeto'} — ${summary.slice(0, 100)}`,
            isRead: false,
          },
        })
      }

      // Notificar cliente
      await prisma.notification.create({
        data: {
          userId,
          type: 'PROJECT_UPDATE',
          title: 'Projeto enviado com sucesso!',
          message: `Seu projeto "${answers?.project_name || 'Novo Projeto'}" foi recebido. A equipe irá analisar e entrar em contato em breve.`,
          isRead: false,
        },
      })

      return NextResponse.json({
        data: { project, summary },
        message: 'Projeto criado com sucesso!',
      })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao processar briefing' }, { status: 500 })
  }
}

function parseBudget(str: string): number | null {
  if (!str) return null
  const match = str.match(/[\d.]+/)
  if (!match) return null
  const num = parseFloat(match[0].replace('.', ''))
  return isNaN(num) ? null : num
}

function parseDeadline(str: string): Date | null {
  if (!str) return null
  const days = str.includes('15') ? 15 : str.includes('30') ? 30 : str.includes('60') ? 60 : str.includes('90') ? 90 : 45
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}
