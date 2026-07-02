import { z } from 'zod'
import { zAccountNumber, zIFSC } from '@/lib/validation/field-validators'

export const addVirtualAccountSchema = z.object({
  accountNumber: zAccountNumber,
  ifsc: zIFSC,
})

export type AddVirtualAccountFormData = z.infer<typeof addVirtualAccountSchema>

export const importVirtualAccountsSchema = z.object({
  csvContent: z.string().min(1, 'CSV content is required'),
})

export type ImportVirtualAccountsFormData = z.infer<typeof importVirtualAccountsSchema>
