import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('-- ANDERFLOW Sistemas - Seeding modo desenvolvedor único --')

  // Clear existing data
  await prisma.taskDependency.deleteMany()
  await prisma.timeEntry.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.message.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.task.deleteMany()
  await prisma.file.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.project.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.userPreference.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing data')

  const adminPassword = await bcrypt.hash('admin123', 12)
  const clientPassword = await bcrypt.hash('client123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@andero.com.br' },
    update: { role: 'ADMIN', plan: 'ENTERPRISE' },
    create: {
      name: 'Anderson',
      email: 'admin@andero.com.br',
      password: adminPassword,
      role: 'ADMIN',
      company: 'ANDERFLOW Sistemas',
      phone: '(11) 99999-0000',
      plan: 'ENTERPRISE',
      isActive: true,
    },
  })
  console.log('Dev:', admin.email)

  const c1 = await prisma.user.upsert({
    where: { email: 'carlos@techstore.com' },
    update: { role: 'CLIENT' },
    create: { name: 'Carlos Silva', email: 'carlos@techstore.com', password: clientPassword, role: 'CLIENT', company: 'TechStore', phone: '(11) 99999-0001', plan: 'PRO', isActive: true },
  })

  const c2 = await prisma.user.upsert({
    where: { email: 'ana@fastfood.com' },
    update: { role: 'CLIENT' },
    create: { name: 'Ana Oliveira', email: 'ana@fastfood.com', password: clientPassword, role: 'CLIENT', company: 'FastFood Co', phone: '(21) 99999-0002', plan: 'PRO', isActive: true },
  })

  const c3 = await prisma.user.upsert({
    where: { email: 'roberto@vendasplus.com' },
    update: { role: 'CLIENT' },
    create: { name: 'Roberto Santos', email: 'roberto@vendasplus.com', password: clientPassword, role: 'CLIENT', company: 'Vendas Plus', phone: '(11) 99999-0003', plan: 'BASIC', isActive: true },
  })

  const c4 = await prisma.user.upsert({
    where: { email: 'juliana@datacorp.com' },
    update: { role: 'CLIENT' },
    create: { name: 'Juliana Costa', email: 'juliana@datacorp.com', password: clientPassword, role: 'CLIENT', company: 'DataCorp', phone: '(31) 99999-0004', plan: 'ENTERPRISE', isActive: true },
  })

  const p1 = await prisma.project.create({
    data: {
      name: 'E-commerce Premium',
      slug: 'e-commerce-premium',
      description: 'Plataforma de e-commerce completa com Stripe e painel admin',
      type: 'SAAS',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 75,
      budget: 45000,
      deadline: new Date('2026-06-30'),
      clientId: c1.id,
      tags: JSON.stringify(['Next.js', 'Stripe']),
    },
  })

  const p2 = await prisma.project.create({
    data: {
      name: 'App de Delivery',
      slug: 'app-delivery',
      description: 'App mobile de delivery com rastreamento GPS',
      type: 'APP_MOBILE',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      progress: 45,
      budget: 28000,
      deadline: new Date('2026-05-15'),
      clientId: c2.id,
      tags: JSON.stringify(['React Native', 'Firebase']),
    },
  })

  const p3 = await prisma.project.create({
    data: {
      name: 'CRM Personalizado',
      slug: 'crm-personalizado',
      description: 'CRM sob medida para equipe de vendas',
      type: 'CRM',
      status: 'REVIEW',
      priority: 'MEDIUM',
      progress: 90,
      budget: 32000,
      deadline: new Date('2026-04-20'),
      clientId: c3.id,
      tags: JSON.stringify(['NestJS', 'PostgreSQL']),
    },
  })

  const p4 = await prisma.project.create({
    data: {
      name: 'Landing Page Rebrand',
      slug: 'landing-page-rebrand',
      description: 'Landing page institucional com SEO',
      type: 'LANDING_PAGE',
      status: 'COMPLETED',
      priority: 'LOW',
      progress: 100,
      budget: 3500,
      deadline: new Date('2026-03-05'),
      clientId: c4.id,
      tags: JSON.stringify(['Next.js', 'SEO']),
    },
  })

  for (const t of [
    { title: 'Design UI/UX', status: 'DONE', priority: 'HIGH', projectId: p1.id, creatorId: admin.id, assigneeId: admin.id, order: 1 },
    { title: 'Estrutura do banco', status: 'DONE', priority: 'HIGH', projectId: p1.id, creatorId: admin.id, assigneeId: admin.id, order: 2 },
    { title: 'API de produtos', status: 'DONE', priority: 'HIGH', projectId: p1.id, creatorId: admin.id, assigneeId: admin.id, order: 3 },
    { title: 'Integracao Stripe', status: 'IN_PROGRESS', priority: 'HIGH', projectId: p1.id, creatorId: admin.id, assigneeId: admin.id, order: 4 },
    { title: 'Painel admin', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: p1.id, creatorId: admin.id, assigneeId: admin.id, order: 5 },
    { title: 'Testes E2E', status: 'TODO', priority: 'MEDIUM', projectId: p1.id, creatorId: admin.id, order: 6 },
    { title: 'Deploy', status: 'TODO', priority: 'HIGH', projectId: p1.id, creatorId: admin.id, order: 7 },
    { title: 'Wireframes', status: 'DONE', priority: 'HIGH', projectId: p2.id, creatorId: admin.id, assigneeId: admin.id, order: 1 },
    { title: 'Tela de login', status: 'DONE', priority: 'HIGH', projectId: p2.id, creatorId: admin.id, assigneeId: admin.id, order: 2 },
    { title: 'Listagem restaurantes', status: 'IN_PROGRESS', priority: 'HIGH', projectId: p2.id, creatorId: admin.id, assigneeId: admin.id, order: 3 },
    { title: 'Carrinho de compras', status: 'TODO', priority: 'HIGH', projectId: p2.id, creatorId: admin.id, order: 4 },
    { title: 'GPS tracking', status: 'TODO', priority: 'URGENT', projectId: p2.id, creatorId: admin.id, order: 5 },
  ]) {
    await prisma.task.create({ data: t })
  }

  await prisma.invoice.create({
    data: {
      number: 'INV-0001', clientId: c1.id, projectId: p1.id, status: 'PAID',
      subtotal: 15000, tax: 0, discount: 0, total: 15000,
      dueDate: new Date('2026-03-01'), paidAt: new Date('2026-02-28'),
      items: JSON.stringify([{ description: 'Sprint 1', quantity: 1, price: 15000, total: 15000 }]),
    },
  })

  await prisma.invoice.create({
    data: {
      number: 'INV-0002', clientId: c2.id, projectId: p2.id, status: 'SENT',
      subtotal: 8500, tax: 0, discount: 0, total: 8500,
      dueDate: new Date('2026-04-15'),
      items: JSON.stringify([{ description: 'Sprint - Mobile', quantity: 1, price: 8500, total: 8500 }]),
    },
  })

  await prisma.invoice.create({
    data: {
      number: 'INV-0003', clientId: c3.id, projectId: p3.id, status: 'OVERDUE',
      subtotal: 12000, tax: 0, discount: 0, total: 12000,
      dueDate: new Date('2026-04-01'),
      items: JSON.stringify([{ description: 'CRM Development', quantity: 1, price: 12000, total: 12000 }]),
    },
  })

  for (const l of [
    { name: 'Fernando Alves', email: 'fernando@innovate.com', company: 'InnovateTech', phone: '(11) 99999-0005', status: 'PROPOSAL', score: 85, value: 30000, source: 'Google Ads' },
    { name: 'Maria Lima', email: 'maria@cloudbase.com', company: 'CloudBase', phone: '(21) 99999-0006', status: 'QUALIFIED', score: 72, value: 22000, source: 'LinkedIn' },
    { name: 'Pedro Martins', email: 'pedro@autosys.com', company: 'AutoSys', phone: '(11) 99999-0007', status: 'NEW', score: 45, value: 18000, source: 'Site' },
    { name: 'Fernanda Dias', email: 'fernanda@scaleup.com', company: 'ScaleUp', phone: '(31) 99999-0008', status: 'CONTACTED', score: 60, value: 40000, source: 'Indicacao' },
  ]) {
    await prisma.lead.create({ data: l })
  }

  for (const t of [
    { title: 'Bug no upload de arquivos', description: 'Arquivos > 50MB falham', priority: 'HIGH', category: 'Bug', creatorId: c1.id, assigneeId: admin.id, status: 'OPEN' },
    { title: 'Duvida sobre integracao API', description: 'Preciso da documentacao', priority: 'MEDIUM', category: 'Suporte', creatorId: c2.id, assigneeId: admin.id, status: 'IN_PROGRESS' },
    { title: 'Solicitar nova funcionalidade', description: 'Relatorios em Excel', priority: 'LOW', category: 'Feature', creatorId: c3.id, assigneeId: admin.id, status: 'OPEN' },
  ]) {
    await prisma.ticket.create({ data: t })
  }

  const ch1 = await prisma.channel.create({ data: { name: 'TechStore', type: 'project' } })
  const ch2 = await prisma.channel.create({ data: { name: 'FastFood Co', type: 'project' } })
  const ch3 = await prisma.channel.create({ data: { name: 'Vendas Plus', type: 'project' } })

  await prisma.message.create({
    data: { content: 'Bom dia Anderson! Quanto falta pro checkout?', senderId: c1.id, channelId: ch1.id, projectId: p1.id },
  })
  await prisma.message.create({
    data: { content: 'Bom dia Carlos! Esta 75% pronto. Entrego ate sexta.', senderId: admin.id, channelId: ch1.id, projectId: p1.id },
  })
  await prisma.message.create({
    data: { content: 'O PIX ja funciona?', senderId: c1.id, channelId: ch1.id, projectId: p1.id },
  })
  await prisma.message.create({
    data: { content: 'Sim! PIX, cartao e boleto estao ok.', senderId: admin.id, channelId: ch1.id, projectId: p1.id },
  })
  await prisma.message.create({
    data: { content: 'Anderson, o app esta lento no Android', senderId: c2.id, channelId: ch2.id, projectId: p2.id },
  })
  await prisma.message.create({
    data: { content: 'Vou otimizar as imagens e melhorar o bundle. Resolvo ate amanha.', senderId: admin.id, channelId: ch2.id, projectId: p2.id },
  })

  for (const n of [
    { userId: admin.id, type: 'PROJECT_UPDATE', title: 'Projeto atualizado', message: 'E-commerce Premium avancou para 75%', isRead: false },
    { userId: admin.id, type: 'PAYMENT', title: 'Pagamento recebido', message: 'TechStore pagou R$ 15.000 via PIX', isRead: false },
    { userId: admin.id, type: 'MESSAGE', title: 'Nova mensagem', message: 'Carlos (TechStore) perguntou sobre o checkout', isRead: false },
    { userId: admin.id, type: 'APPROVAL', title: 'Aprovacao pendente', message: 'FastFood Co precisa aprovar o layout mobile', isRead: true },
    { userId: admin.id, type: 'CONTRACT', title: 'Fatura vencida', message: 'Vendas Plus: fatura INV-0003 esta vencida', isRead: false },
  ]) {
    await prisma.notification.create({ data: n })
  }

  console.log(`Seed completo: 1 dev + ${await prisma.user.count({ where: { role: 'CLIENT' } })} clientes`)
  console.log(`Projetos: ${await prisma.project.count()} | Tarefas: ${await prisma.task.count()} | Faturas: ${await prisma.invoice.count()}`)
  console.log(`Leads: ${await prisma.lead.count()} | Tickets: ${await prisma.ticket.count()} | Notificacoes: ${await prisma.notification.count()}`)
  console.log(`Canais: ${await prisma.channel.count()} | Mensagens: ${await prisma.message.count()}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
