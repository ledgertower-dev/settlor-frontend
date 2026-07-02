import { z } from 'zod'

export const channelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(100, 'Name must be 100 characters or less'),
  webhookUrl: z.string(),
  webhookSecret: z.string(),
  apiKey: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type ChannelFormData = z.infer<typeof channelSchema>
