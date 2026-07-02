import { z } from 'zod'
import { zAccountNumber, zIFSC, zName } from '@/lib/validation/field-validators'

// Step 1 — Payout Details
export const payoutDetailsSchema = z.object({
  name: z
    .string()
    .min(1, 'Schedule name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  paymentMode: z.enum(['IMPS', 'NEFT', 'RTGS'], {
    message: 'Payment mode is required',
  }),
  walletId: z.string().min(1, 'Wallet is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number')
    .refine(val => Number(val) <= 10_00_00_000, 'Amount cannot exceed ₹10,00,00,000'),
  beneficiaryName: zName,
  accountNumber: zAccountNumber,
  ifsc: zIFSC,
  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .min(2, 'Bank name must be at least 2 characters'),
  remarks: z.string().min(1, 'Remarks is required'),
  beneficiaryAddress: z.string().optional().or(z.literal('')),
  referenceId: z.string().optional().or(z.literal('')),
})

// Step 2 — Schedule Configuration
// Using string types for numeric fields to avoid z.coerce type mismatches with react-hook-form
export const scheduleConfigSchema = z
  .object({
    scheduleType: z.enum(['ONE_TIME', 'RECURRING'], {
      message: 'Schedule type is required',
    }),
    executionDate: z.string().optional().or(z.literal('')),
    executionTime: z.string().min(1, 'Execution time is required'),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
    dayOfWeek: z.enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']).optional(),
    dayOfMonth: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        val => !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 31),
        'Day must be between 1 and 31',
      ),
    lastWorkingDay: z.boolean().optional(),
    intervalDays: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        val => !val || (!isNaN(Number(val)) && Number(val) >= 1),
        'Interval must be at least 1',
      ),
    startDate: z.string().optional().or(z.literal('')),
    endCondition: z.enum(['NEVER', 'AFTER_OCCURRENCES', 'ON_DATE']),
    endOccurrences: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 1), 'Must be at least 1'),
    endDate: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // One-Time: executionDate is required
    if (data.scheduleType === 'ONE_TIME') {
      if (!data.executionDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Execution date is required',
          path: ['executionDate'],
        })
      }
    }

    // Recurring validations
    if (data.scheduleType === 'RECURRING') {
      if (!data.frequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Frequency is required',
          path: ['frequency'],
        })
      }

      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required',
          path: ['startDate'],
        })
      }

      // Weekly: dayOfWeek required
      if (data.frequency === 'WEEKLY' && !data.dayOfWeek) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Day of week is required',
          path: ['dayOfWeek'],
        })
      }

      // Monthly: dayOfMonth required if not lastWorkingDay
      if (data.frequency === 'MONTHLY' && !data.lastWorkingDay && !data.dayOfMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Day of month is required',
          path: ['dayOfMonth'],
        })
      }

      // Custom: intervalDays required
      if (data.frequency === 'CUSTOM' && !data.intervalDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Interval is required',
          path: ['intervalDays'],
        })
      }

      // End condition: occurrences or date required
      if (data.endCondition === 'AFTER_OCCURRENCES' && !data.endOccurrences) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number of occurrences is required',
          path: ['endOccurrences'],
        })
      }

      if (data.endCondition === 'ON_DATE' && !data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required',
          path: ['endDate'],
        })
      }
    }
  })

export type PayoutDetailsFormData = z.infer<typeof payoutDetailsSchema>
export type ScheduleConfigFormData = z.infer<typeof scheduleConfigSchema>
