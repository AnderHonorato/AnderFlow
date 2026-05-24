import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET() {
  try {
    const schema = await prisma.briefingSchema.findFirst({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({
      data: schema?.fields ? (typeof schema.fields === 'string' ? JSON.parse(schema.fields) : schema.fields) : getDefaultSchema(),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar schema' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { fields } = body
    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields array é obrigatório' }, { status: 400 })
    }
    const existing = await prisma.briefingSchema.findFirst()
    if (existing) {
      await prisma.briefingSchema.update({ where: { id: existing.id }, data: { fields } })
    } else {
      await prisma.briefingSchema.create({ data: { fields } })
    }
    return NextResponse.json({ data: { fields } })
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar schema' }, { status: 500 })
  }
}

function getDefaultSchema() {
  return [
    { id: 'project_name', type: 'text', label: 'Nome do projeto', placeholder: 'Ex: Site Institucional', required: true },
    { id: 'description', type: 'textarea', label: 'Descrição do projeto', placeholder: 'Descreva em detalhes o que você precisa', required: true },
    { id: 'budget', type: 'select', label: 'Orçamento estimado', placeholder: 'Selecione uma faixa', required: false, options: ['Até R\$ 3.000', 'R\$ 3.000 - R\$ 10.000', 'R\$ 10.000 - R\$ 30.000', 'Acima de R\$ 30.000'] },
    { id: 'deadline', type: 'select', label: 'Prazo desejado', placeholder: 'Quando você precisa?', required: false, options: ['15 dias', '30 dias', '45 dias', '60 dias', '90 dias', 'Sem pressa'] },
  ]
}
