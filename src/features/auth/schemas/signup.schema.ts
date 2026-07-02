import * as z from 'zod'
import {
  zPhone,
  zEmail,
  zPassword,
  zConfirmPassword,
  zDOBOptional,
  zName,
} from '@/lib/validation/field-validators'

export const signupSchema = z
  .object({
    name: zName,
    mobile: zPhone,
    email: zEmail,
    gender: z.string().optional(),
    dob: zDOBOptional,
    password: zPassword,
    confirmPassword: zConfirmPassword,
    address: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupFormData = z.infer<typeof signupSchema>
