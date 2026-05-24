import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.projectTemplate.count()
  if (existing > 0) {
    console.log('Templates já existem, pulando seed.')
    return
  }

  const templates = [
    {
      name: 'Site Institucional',
      description: 'Template para sites institucionais com páginas de serviço, sobre e contato.',
      tasks: JSON.stringify([
        { title: 'Briefing', description: 'Coleta de requisitos e briefing com cliente', order: 1 },
        { title: 'Wireframe', description: 'Estrutura de páginas e navegação', order: 2 },
        { title: 'Design', description: 'Criação do layout e identidade visual', order: 3 },
        { title: 'Aprovação', description: 'Cliente aprova o design', order: 4 },
        { title: 'Frontend', description: 'Desenvolvimento do frontend responsivo', order: 5 },
        { title: 'Deploy', description: 'Publicação e configuração do domínio', order: 6 },
      ]),
    },
    {
      name: 'E-commerce',
      description: 'Template para lojas virtuais com carrinho, checkout e integração de pagamento.',
      tasks: JSON.stringify([
        { title: 'Requisitos', description: 'Levantamento de produtos, categorias e regras de negócio', order: 1 },
        { title: 'Design', description: 'UI/UX da loja, vitrine e páginas de produto', order: 2 },
        { title: 'Catálogo de Produtos', description: 'CRUD de produtos, categorias e variações', order: 3 },
        { title: 'Carrinho', description: 'Adicionar/remover itens, cálculo de frete', order: 4 },
        { title: 'Pagamento', description: 'Integração com gateway de pagamento', order: 5 },
        { title: 'Testes', description: 'Testes de fluxo de compra e correções', order: 6 },
        { title: 'Lançamento', description: 'Deploy e monitoramento pós-lançamento', order: 7 },
      ]),
    },
    {
      name: 'App Mobile',
      description: 'Template para aplicativos mobile iOS e Android com backend API.',
      tasks: JSON.stringify([
        { title: 'Protótipo', description: 'Protótipo navegável e fluxo de telas', order: 1 },
        { title: 'UI Design', description: 'Design das telas e componentes mobile', order: 2 },
        { title: 'Backend API', description: 'API REST com autenticação e CRUD', order: 3 },
        { title: 'iOS', description: 'Desenvolvimento do app iOS nativo', order: 4 },
        { title: 'Android', description: 'Desenvolvimento do app Android nativo', order: 5 },
        { title: 'Beta', description: 'Distribuição beta para testes com usuários reais', order: 6 },
        { title: 'Publicação', description: 'Publicação nas lojas App Store e Google Play', order: 7 },
      ]),
    },
  ]

  for (const t of templates) {
    await prisma.projectTemplate.create({ data: t })
  }

  console.log(`Criados ${templates.length} templates padrão.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
