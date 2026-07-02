/**
 * Audit Log Type Definitions
 *
 * Types for audit log entities and related operations
 */

// ============================================================================
// Audit Action Types
// ============================================================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'

// ============================================================================
// Base Entity Types
// ============================================================================

/**
 * Represents a change to a single item within an array (for itemized tracking)
 */
export interface ItemizedArrayChange {
  /** Type of change: 'added', 'removed', 'modified', 'reordered' */
  changeType: 'added' | 'removed' | 'modified' | 'reordered'

  /** Unique identifier of the item */
  itemId: string

  /** Display name of the item */
  itemName: string

  /** Human-readable summary */
  summary: string

  /** For modified items: individual field changes within the item */
  fieldChanges?: Array<{
    field: string
    label: string
    oldValue: unknown
    newValue: unknown
    oldDisplayValue?: string
    newDisplayValue?: string
  }>

  /** For reordered items: position change info */
  positionChange?: {
    oldPosition: number
    newPosition: number
  }
}

export interface FieldChange {
  field: string
  label: string
  oldValue: unknown
  newValue: unknown
  oldDisplayValue?: string
  newDisplayValue?: string
  /** For array fields with itemized changes */
  itemizedChanges?: ItemizedArrayChange[]
}

export interface AuditLog {
  id: string
  createdAt: string
  role?: string
  userEmail?: string
  userName?: string
  ipAddress?: string
  event: string
  actionLabel: string
  outcome: 'success' | 'failed' | 'neutral'
  merchantId?: string
  merchantName?: string
  description: string
}

/** Raw backend audit log shape (snake_case) */
export interface BackendAuditLog {
  id: string
  created_at: string
  role?: string
  user_email?: string
  user_name?: string
  ip_address?: string
  event: string
  action_label: string
  outcome: 'success' | 'failed' | 'neutral'
  merchant_id?: string
  merchant_name?: string
  description: string
}

// ============================================================================
// Category & Status Types
// ============================================================================

export type AuditLogCategory = 'auth' | 'payout' | 'deposit' | 'action'

export type AuditLogStatus = 'success' | 'failed'

// ============================================================================
// Filter and Pagination Types
// ============================================================================

import type { PaginationFilters } from '@/lib/types/pagination.types'

export interface AuditLogFilters extends PaginationFilters {
  category: AuditLogCategory
  status?: AuditLogStatus
  dateFrom: string
  dateTo: string
  merchantFilter: string
  merchantFilterLabel: string
  sort: string
  order: 'asc' | 'desc'
}

export interface AuditLogListParams {
  page?: number
  per_page?: number
  category?: AuditLogCategory
  status?: AuditLogStatus
  q?: string
  created_from?: string
  created_to?: string
  sort?: string
  order?: 'asc' | 'desc'
  merchant_id?: string
}

// ============================================================================
// API Response Types
// ============================================================================

/** Raw backend response shape */
export interface BackendAuditLogsResponse {
  success: boolean
  data: BackendAuditLog[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}
