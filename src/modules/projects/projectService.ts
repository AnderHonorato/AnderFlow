import { projectRepository } from './projectRepository'
import type { CreateProjectDto, UpdateProjectDto } from './projectSchema'
import { sanitize } from '@/lib/utils/sanitize'

export const projectService = {
  getUserProjects: async (userId: string, isAdmin: boolean) => {
    return projectRepository.findByUserId(userId, isAdmin)
  },

  getProjectById: async (id: string) => {
    return projectRepository.findById(id)
  },

  createProject: async (userId: string, isAdmin: boolean, data: CreateProjectDto) => {
    const clientId = isAdmin ? (data.clientId || userId) : userId
    const status = isAdmin ? (data.status || undefined) : 'PENDING'

    const slug = sanitize.slug(data.name) + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

    return projectRepository.create({
      name: sanitize.trim(data.name, 200),
      slug,
      description: sanitize.text(data.description || ''),
      type: data.type || 'CUSTOM',
      client: { connect: { id: clientId } },
      status,
      priority: data.priority || 'MEDIUM',
      tags: JSON.stringify([]),
    })
  },

  updateProject: async (id: string, data: UpdateProjectDto) => {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = sanitize.trim(data.name, 200)
    if (data.description !== undefined) updateData.description = sanitize.text(data.description)
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.progress !== undefined) updateData.progress = data.progress

    return projectRepository.update(id, updateData)
  },

  archiveProject: async (id: string) => {
    return projectRepository.archive(id)
  },
}
