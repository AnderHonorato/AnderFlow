import { z } from 'zod'

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Nome do projeto obrigatorio').max(200),
  description: z.string().max(5000).optional().default(''),
  type: z.string().max(50).optional().default('CUSTOM'),
  clientId: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
})

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  progress: z.number().min(0).max(100).optional(),
})

export type CreateProjectDto = z.infer<typeof projectCreateSchema>
export type UpdateProjectDto = z.infer<typeof projectUpdateSchema>
