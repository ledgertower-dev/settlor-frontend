/**
 * TanStack Query hooks for Access/Permissions feature
 *
 * Provides hooks for fetching the permissions catalog
 * Uses React Query for caching and automatic refetching
 */

import { useQuery } from '@tanstack/react-query'
import { accessService } from '../api/access.api'
import type { Permission } from '@/lib/types/api-types'

/**
 * Query Keys
 */
export const permissionsKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionsKeys.all, 'list'] as const,
  list: () => [...permissionsKeys.lists()] as const,
}

/**
 * Get all permissions (catalog)
 *
 * Used for role assignment UIs and permission browsing
 *
 * @example
 * ```tsx
 * const { data: permissions, isLoading } = usePermissions()
 * ```
 */
export function usePermissions(accountType?: string) {
  return useQuery<Permission[], Error>({
    queryKey: [...permissionsKeys.list(), accountType],
    queryFn: () => accessService.getPermissions(accountType),
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  })
}
