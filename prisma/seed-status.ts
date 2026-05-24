import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.statusComponent.count()
  if (existing > 0) { console.log('Status components já existem.'); return }

  const components = [
    { name: 'Portal do Cliente', status: 'operational', order: 1 },
    { name: 'Chat / Mensagens', status: 'operational', order: 2 },
    { name: 'API', status: 'operational', order: 3 },
    { name: 'Pagamentos', status: 'operational', order: 4 },
  ]

  for (const c of components) {
    await prisma.statusComponent.create({ data: c })
  }
  console.log(`Criados ${components.length} status components.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
