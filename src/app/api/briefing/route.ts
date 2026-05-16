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
      const summary = generateSummary(categoryId || 'OTHER', answers || {})

      // Generate formatted project number: PRJ-YYYY-NNNN
      const year = new Date().getFullYear()
      const count = await prisma.project.count({
        where: { createdAt: { gte: new Date(`${year}-01-01`) } },
      })
      const projectNumber = `PRJ-${year}-${String(count + 1).padStart(4, '0')}`

      const project = await prisma.project.create({
        data: {
          number: projectNumber,
          name: answers?.project_name || 'Novo Projeto',
          slug: (answers?.project_name || 'projeto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
          description: answers?.description || summary,
          type: categoryId || 'CUSTOM',
          clientId: userId,
          status: 'PENDING',
          priority: answers?.priority === 'Crítica' ? 'URGENT' : answers?.priority === 'Alta' ? 'HIGH' : answers?.priority === 'Baixa' ? 'LOW' : 'MEDIUM',
          tags: JSON.stringify([categoryId]),
          briefing: JSON.stringify({ answers, template: getTemplateForCategory(categoryId || 'OTHER'), summary, submittedAt: new Date().toISOString() }),
          budget: answers?.budget ? parseBudget(answers.budget) : null,
          deadline: answers?.deadline ? parseDeadline(answers.deadline) : null,
        },
        include: { client: { select: { id: true, name: true } } },
      })

      // Create default milestones (timeline)
      const defaultMilestones = [
        { name: 'Briefing', description: 'Coleta de requisitos e entendimento do projeto', order: 0, dueDate: addDays(new Date(), 7) },
        { name: 'Planejamento', description: 'Definição de escopo, cronograma e recursos', order: 1, dueDate: addDays(new Date(), 14) },
        { name: 'Design', description: 'Criação de wireframes, UI/UX e protótipos', order: 2, dueDate: addDays(new Date(), 28) },
        { name: 'Desenvolvimento', description: 'Codificação e implementação', order: 3, dueDate: addDays(new Date(), 56) },
        { name: 'Testes', description: 'Testes de qualidade e ajustes finos', order: 4, dueDate: addDays(new Date(), 70) },
        { name: 'Deploy', description: 'Publicação e configuração do ambiente', order: 5, dueDate: addDays(new Date(), 77) },
        { name: 'Entrega', description: 'Apresentação final e documentação', order: 6, dueDate: addDays(new Date(), 84) },
      ]
      await prisma.milestone.createMany({
        data: defaultMilestones.map(m => ({ ...m, projectId: project.id })),
      })

      // Update draft as submitted
      if (draftId) {
        await prisma.briefingDraft.update({
          where: { id: draftId },
          data: { submitted: true, projectId: project.id },
        })
      }

      // Notify admin (skip the creator if they are also admin)
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        if (admin.id === userId) continue
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PROJECT_UPDATE',
            title: `Novo projeto: ${projectNumber}`,
            message: `${answers?.project_name || 'Novo projeto'} — ${summary.slice(0, 100)}`,
            isRead: false,
          },
        })
      }

      // Notify client
      await prisma.notification.create({
        data: {
          userId,
          type: 'PROJECT_UPDATE',
          title: `Projeto ${projectNumber} enviado!`,
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

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
