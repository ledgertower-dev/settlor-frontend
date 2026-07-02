/**
 * Audit Logs API Service
 *
 * Connects to the admin audit logs backend endpoint
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  AuditLog,
  AuditLogListParams,
  BackendAuditLog,
  BackendAuditLogsResponse,
} from '../types/audit-log.types'

// ============================================================================
// Transform helpers
// ============================================================================

function transformAuditLog(backend: BackendAuditLog): AuditLog {
  return {
    id: backend.id,
    createdAt: backend.created_at,
    role: backend.role,
    userEmail: backend.user_email,
    userName: backend.user_name,
    ipAddress: backend.ip_address,
    event: backend.event,
    actionLabel: backend.action_label,
    outcome: backend.outcome,
    merchantId: backend.merchant_id,
    merchantName: backend.merchant_name,
    description: backend.description,
  }
}

// ============================================================================
// Service
// ============================================================================

class AuditLogsService {
  /**
   * Get paginated list of audit logs
   */
  async getAuditLogs(params?: AuditLogListParams): Promise<PaginatedResponse<AuditLog>> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              page: params.page,
              per_page: params.per_page,
              category: params.category,
              status: params.status,
              q: params.q,
              created_from: params.created_from ? `${params.created_from}T00:00:00Z` : undefined,
              created_to: params.created_to ? `${params.created_to}T23:59:59Z` : undefined,
              sort: params.sort,
              order: params.order,
              merchant_id: params.merchant_id,
            }
          : undefined,
      )
      const url = `/admin/audit-logs${qs}`
      const response = await apiClient.get<BackendAuditLogsResponse>(url)

      const backendLogs = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendLogs) ? backendLogs.map(transformAuditLog) : []

      return {
        data: { items },
        meta: {
          pagination: normalizePaginationMeta(
            meta ?? { page: 1, per_page: 15, total: items.length, total_pages: 1 },
          ),
        },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const auditLogsService = new AuditLogsService()
