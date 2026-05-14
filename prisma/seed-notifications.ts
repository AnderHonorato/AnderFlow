import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@andero.com.br' } })
  if (!admin) { console.log('Admin not found, run seed first'); return }

  await prisma.notification.deleteMany()

  const notifications = [
    { userId: admin.id, type: 'PROJECT_UPDATE', title: 'Projeto atualizado', message: 'E-commerce Premium avancou para 75%', isRead: false },
    { userId: admin.id, type: 'PAYMENT', title: 'Pagamento recebido', message: 'TechStore pagou R$ 15.000 via PIX', isRead: false },
    { userId: admin.id, type: 'MESSAGE', title: 'Nova mensagem', message: 'Carlos da TechStore enviou uma mensagem', isRead: false },
    { userId: admin.id, type: 'APPROVAL', title: 'Aprovacao necessaria', message: 'FastFood Co precisa aprovar o layout', isRead: true },
    { userId: admin.id, type: 'CONTRACT', title: 'Contrato assinado', message: 'Vendas Plus assinou o contrato do CRM', isRead: true },
  ]

  for (const n of notifications) {
    await prisma.notification.create({ data: n })
  }

  console.log('Notifications seeded:', await prisma.notification.count())
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
