import { z } from 'zod'

export const revertTransactionSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
  reason: z.string().min(1, 'Reason for reversion is required'),
})

export type RevertTransactionFormData = z.infer<typeof revertTransactionSchema>
