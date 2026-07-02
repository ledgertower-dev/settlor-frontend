import { z } from 'zod'

export const editRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
})

export type EditRoleForm = z.infer<typeof editRoleSchema>
