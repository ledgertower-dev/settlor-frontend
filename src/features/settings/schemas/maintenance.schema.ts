import { z } from 'zod/v4'

export const maintenanceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ipAddress: z.string().optional(),
  fromDate: z.string().min(1, 'From date is required'),
  fromTime: z.string().min(1, 'From time is required'),
  toDate: z.string().min(1, 'To date is required'),
  toTime: z.string().min(1, 'To time is required'),
})

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>
