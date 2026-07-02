import { z } from 'zod'
import {
  zName,
  zEmail,
  zPhone,
  zPassword,
  zConfirmPassword,
} from '@/lib/validation/field-validators'

export const createUserSchema = z
  .object({
    name: zName,
    email: zEmail,
    phone: zPhone,
    role_id: z.string().min(1, 'Please select a role'),
    password: zPassword,
    confirmPassword: zConfirmPassword,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
