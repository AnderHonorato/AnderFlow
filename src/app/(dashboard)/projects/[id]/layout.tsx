import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { client: { select: { name: true } } },
    })

    if (!project) {
      return { title: 'Projeto - ANDERFLOW' }
    }

    return {
      title: `${project.name} - ANDERFLOW`,
      description: project.description || `Projeto ${project.name} - Cliente: ${project.client?.name || 'N/A'}`,
      openGraph: {
        title: `${project.name} - ANDERFLOW`,
        description: project.description || `Projeto ${project.name}`,
        images: [`/projects/${project.id}/opengraph-image`],
      },
    }
  } catch {
    return { title: 'Projeto - ANDERFLOW' }
  }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
