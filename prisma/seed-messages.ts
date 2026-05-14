import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@andero.com.br' } })
  const client = await prisma.user.findFirst({ where: { email: 'carlos@techstore.com' } })
  const project = await prisma.project.findFirst({ where: { slug: 'e-commerce-premium' } })

  if (!admin || !client || !project) {
    console.log('Missing users/project, run main seed first')
    return
  }

  let channel = await prisma.channel.findFirst({ where: { name: 'TechStore Chat' } })
  if (!channel) {
    channel = await prisma.channel.create({
      data: { name: 'TechStore Chat', type: 'project' }
    })
  }

  await prisma.message.deleteMany({ where: { channelId: channel.id } })

  const msgs = [
    { content: 'Bom dia! Preciso de uma atualizacao do projeto.', senderId: client.id, channelId: channel.id, projectId: project.id },
    { content: 'Bom dia Carlos! Estamos com 75% concluido. O checkout fica pronto ate sexta.', senderId: admin.id, channelId: channel.id, projectId: project.id },
    { content: 'Otimo! E a integracao com PIX, ja esta funcionando?', senderId: client.id, channelId: channel.id, projectId: project.id },
    { content: 'Sim! PIX, cartao de credito e boleto ja estao configurados.', senderId: admin.id, channelId: channel.id, projectId: project.id },
    { content: 'Excelente trabalho! Podemos marcar uma call amanha?', senderId: client.id, channelId: channel.id, projectId: project.id },
    { content: 'Claro! As 14h funciona para voce?', senderId: admin.id, channelId: channel.id, projectId: project.id },
  ]

  for (const msg of msgs) {
    await prisma.message.create({ data: msg })
  }

  console.log('Messages seeded:', await prisma.message.count())
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
