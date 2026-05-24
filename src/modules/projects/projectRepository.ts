import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const projectInclude = {
  client: { select: { id: true, name: true, company: true, email: true } },
  _count: { select: { tasks: true } },
} as const

export const projectRepository = {
  findByUserId: async (userId: string, isAdmin: boolean) => {
    const where: Prisma.ProjectWhereInput = { isArchived: false }
    if (!isAdmin) {
      where.clientId = userId
    }
    return prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    })
  },

  findById: async (id: string) => {
    return prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        tasks: true,
        _count: { select: { tasks: true } },
      },
    })
  },

  create: async (data: Prisma.ProjectCreateInput) => {
    return prisma.project.create({
      data,
      include: { client: { select: { id: true, name: true } } },
    })
  },

  update: async (id: string, data: Prisma.ProjectUpdateInput) => {
    return prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    })
  },

  archive: async (id: string) => {
    return prisma.project.update({
      where: { id },
      data: { isArchived: true },
    })
  },
}
