'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Always treat data as stale so navigating to a page (or switching a
            // tab, which changes the query key) fetches fresh data instead of
            // serving the cache.
            staleTime: 0,
            // Force a refetch every time a query mounts, even if cached data is
            // present. This is what makes every page reload its data on open.
            refetchOnMount: 'always',
            // Cached data is kept for 10 minutes so it can paint instantly while
            // the fresh data loads in the background (no loading flash).
            gcTime: 1000 * 60 * 10,
            // Disable automatic refetch when window regains focus
            // This prevents unnecessary API calls during development and normal usage
            refetchOnWindowFocus: false,
            // Retry failed queries once before throwing error
            // Helps with transient network issues
            retry: 1,
          },
          mutations: {
            // Don't retry mutations to prevent duplicate operations
            // Mutations should be explicit user actions
            retry: 0,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
