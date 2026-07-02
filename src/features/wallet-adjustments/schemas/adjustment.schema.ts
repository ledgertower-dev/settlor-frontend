import { z } from 'zod/v4'

export const adjustmentSchema = z.object({
  direction: z.enum(['CREDIT', 'DEBIT'], { message: 'Direction is required' }),
  amount: z
    .number({ error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(0.01, 'Minimum amount is 0.01'),
  remarks: z
    .string()
    .min(1, 'Remarks are required')
    .max(500, 'Remarks must be 500 characters or less'),
})

export type AdjustmentFormData = z.infer<typeof adjustmentSchema>
