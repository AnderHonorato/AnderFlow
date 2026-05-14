import { prisma } from '@/lib/prisma'
import { KnowledgeClient } from './knowledge-client'

export default async function KnowledgePage() {
  const projects = await prisma.project.findMany({
    where: { status: 'COMPLETED' },
    include: { client: { select: { id: true, name: true } } },
    orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  return <KnowledgeClient projects={JSON.parse(JSON.stringify(projects))} />
}
