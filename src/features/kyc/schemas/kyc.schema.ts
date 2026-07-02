import { z } from 'zod'
import {
  zBusinessPhone,
  zEmailRequired,
  zPAN,
  zWebsiteOptional,
} from '@/lib/validation/field-validators'

export const kycSchema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  businessName: z.string().min(1, 'Business name is required'),
  businessEmail: zEmailRequired,
  businessMobile: zBusinessPhone,
  website: zWebsiteOptional,
  companyPan: zPAN,
})

export type KycFormData = z.infer<typeof kycSchema>
