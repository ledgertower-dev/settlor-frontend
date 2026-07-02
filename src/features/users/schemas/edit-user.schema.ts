import { z } from 'zod'

export const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role_id: z.string().min(1, 'Please select a role'),
  status: z.enum(['active', 'inactive']),
})

export type EditUserFormData = z.infer<typeof editUserSchema>
