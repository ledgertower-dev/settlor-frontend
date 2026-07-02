import { z } from 'zod/v4'
import {
  zAccountNumber,
  zAccountNumberOptional,
  zIFSC,
  zIFSCOptional,
} from '@/lib/validation/field-validators'

export const whitelistIPSchema = z.object({
  ipAddress: z.string().min(1, 'IP Address is required'),
  description: z.string().optional(),
  type: z.enum(['PLATFORM', 'API_TRANSACTIONS'], { message: 'Whitelisting type is required' }),
})

export type WhitelistIPFormData = z.infer<typeof whitelistIPSchema>

export const editWhitelistIPSchema = whitelistIPSchema

export type EditWhitelistIPFormData = z.infer<typeof editWhitelistIPSchema>

export const whitelistAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: zAccountNumber,
  ifscCode: zIFSC,
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  alternateAccountNumber: zAccountNumberOptional,
  alternateIfsc: zIFSCOptional,
})

export type WhitelistAccountFormData = z.infer<typeof whitelistAccountSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
