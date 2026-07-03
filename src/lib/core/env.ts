import { z } from 'zod'
import { logger } from '@/lib/core/logger'

declare global {
  interface Window {
    __ENV?: Record<string, string>
  }
}

function getEnvVar(key: string): string | undefined {
  if (typeof window !== 'undefined') {
    return window.__ENV?.[key] ?? process.env[key]
  }
  return process.env[key]
}

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_WS_URL: z.string().url().default('ws://localhost:3001'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: getEnvVar('NEXT_PUBLIC_API_BASE_URL'),
  NEXT_PUBLIC_WS_URL: getEnvVar('NEXT_PUBLIC_WS_URL'),
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsed.success) {
  logger.error('Invalid environment variables', { errors: parsed.error.flatten().fieldErrors })
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
