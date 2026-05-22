import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KnowledgeClient } from './knowledge-client'
import { redirect } from 'next/navigation'

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as any
  const isAdminUser = user.role === 'ADMIN' || user.role === 'DEVELOPER'

  const projects = await prisma.project.findMany({
    where: {
      status: 'COMPLETED',
      ...(isAdminUser ? {} : { clientId: user.id }),
    },
    include: { client: { select: { id: true, name: true } } },
    orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  return <KnowledgeClient projects={JSON.parse(JSON.stringify(projects))} />
}
