'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/core/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Global error', { error: error.message })
  }, [error])

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
