import { z } from 'zod'
import { zName, zEmail, zPhone } from '@/lib/validation/field-validators'

export const viewUserSchema = z.object({
  name: zName,
  email: zEmail,
  phone: zPhone,
  role_id: z.string().min(1, 'Please select a role'),
  password: z
    .string()
    .optional()
    .refine(val => !val || val.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
})

export type ViewUserFormData = z.infer<typeof viewUserSchema>
