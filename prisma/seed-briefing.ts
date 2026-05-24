import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.briefingSchema.findFirst()
  if (existing) { console.log('Schema já existe.'); return }

  await prisma.briefingSchema.create({
    data: {
      fields: [
        { id: 'project_name', type: 'text', label: 'Nome do projeto', placeholder: 'Ex: Site Institucional', required: true },
        { id: 'description', type: 'textarea', label: 'Descrição do projeto', placeholder: 'Descreva em detalhes', required: true },
        { id: 'budget', type: 'select', label: 'Orçamento estimado', placeholder: 'Selecione', required: false, options: ['Até R$ 3.000', 'R$ 3.000 - R$ 10.000', 'Acima de R$ 30.000'] },
        { id: 'deadline', type: 'select', label: 'Prazo desejado', placeholder: 'Quando precisa?', required: false, options: ['15 dias', '30 dias', '60 dias', '90 dias'] },
        { id: 'priority', type: 'select', label: 'Prioridade', placeholder: 'Selecione', required: false, options: ['Baixa', 'Média', 'Alta'] },
      ],
    },
  })
  console.log('Schema de briefing criado com campos padrão.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
