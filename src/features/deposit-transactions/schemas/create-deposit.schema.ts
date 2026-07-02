import { z } from 'zod'

export const createDepositSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0'),
  fromBankAccountId: z.string().min(1, 'Bank account is required'),
  utr: z.string().min(1, 'UTR is required'),
  paymentScreenshotId: z.string().min(1, 'Payment screenshot is required'),
})

export type CreateDepositFormData = z.infer<typeof createDepositSchema>
