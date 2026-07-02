import { z } from 'zod'
import { zName, zAccountNumber, zIFSC } from '@/lib/validation/field-validators'

export const beneficiarySchema = z.object({
  beneficiaryName: zName,
  accountNumber: zAccountNumber,
  ifsc: zIFSC,
  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .min(2, 'Bank name must be at least 2 characters'),
  address: z.string().optional().or(z.literal('')),
})

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>
