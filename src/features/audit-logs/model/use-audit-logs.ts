/**
 * Audit Logs TanStack Query Hooks
 *
 * Provides React Query hooks for audit logs operations
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { auditLogsService } from '../api/audit-logs.api'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type { AuditLog, AuditLogListParams } from '../types/audit-log.types'

// ============================================================================
// Query Keys
// ============================================================================

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (params?: AuditLogListParams) => [...auditLogKeys.lists(), params] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get paginated list of audit logs
 */
export function useAuditLogs(
  params?: AuditLogListParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<AuditLog>, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PaginatedResponse<AuditLog>, Error>({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogsService.getAuditLogs(params),
    ...options,
  })
}
