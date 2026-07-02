import { z } from 'zod'

export const createPayoutSchema = z.object({
  paymentMode: z.enum(['NEFT', 'IMPS', 'RTGS', 'UPI'], {
    message: 'Payment mode is required',
  }),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number')
    .refine(val => Number(val) <= 10_00_00_000, 'Amount cannot exceed ₹10,00,00,000'),
  beneficiaryName: z
    .string()
    .min(1, 'Beneficiary name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z\s.'-]+$/,
      'Name can only contain letters, spaces, dots, hyphens and apostrophes',
    ),
  beneficiaryAccount: z
    .string()
    .min(1, 'Beneficiary account is required')
    .regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  beneficiaryIfsc: z
    .string()
    .min(1, 'Beneficiary IFSC is required')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  beneficiaryAddress: z.string().optional().or(z.literal('')),
  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .min(2, 'Bank name must be at least 2 characters'),
  referenceId: z.string().optional().or(z.literal('')),
  remarks: z.string().min(1, 'Remarks is required'),
})

export type CreatePayoutFormData = z.infer<typeof createPayoutSchema>

export const statusOverrideSchema = z.object({
  newStatus: z.enum(
    ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'PENDING_APPROVAL'],
    { message: 'Status is required' },
  ),
  password: z.string().min(1, 'Password is required'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
})

export type StatusOverrideFormData = z.infer<typeof statusOverrideSchema>
