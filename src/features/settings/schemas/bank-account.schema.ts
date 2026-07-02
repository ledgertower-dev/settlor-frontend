import { z } from 'zod'
import {
  zPassword,
  zConfirmPassword,
  zAccountNumber,
  zIFSC,
} from '@/lib/validation/field-validators'

export const changePasswordSchema = z
  .object({
    password: zPassword,
    confirmPassword: zConfirmPassword,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: zAccountNumber,
  ifsc: zIFSC,
  accountType: z.enum(['SAVINGS', 'CURRENT']),
})

export type BankAccountFormData = z.infer<typeof bankAccountSchema>
