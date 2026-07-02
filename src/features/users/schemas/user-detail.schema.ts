import { z } from 'zod'

export const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  status: z.enum(['active', 'inactive']),
})

export const teamsSchema = z.object({
  teamIds: z.array(z.string()),
})

export const rolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>
export type TeamsFormData = z.infer<typeof teamsSchema>
export type RolesFormData = z.infer<typeof rolesSchema>
