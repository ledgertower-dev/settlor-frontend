import { z } from 'zod'
import { logger } from '@/lib/core/logger'

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsed.success) {
  logger.error('Invalid environment variables', { errors: parsed.error.flatten().fieldErrors })
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
