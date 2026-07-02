/**
 * Report Types
 *
 * Types for the export reports feature matching the backend API
 */

// ============================================================================
// Report Status & Type
// ============================================================================

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'

export type ReportType = 'PAYOUT_TRANSACTIONS' | 'DEPOSIT_PAYOUT' | 'LEDGER'

// ============================================================================
// Backend Types (snake_case — raw API response)
// ============================================================================

export interface BackendReport {
  id: string
  report_type: string
  report_type_label?: string
  merchant?: string
  date_range?: string
  filter_summary?: string
  requested_by_email?: string
  generated_at: string
  completed_at?: string
  status: string
  can_download: boolean
}

export interface BackendReportsListResponse {
  success: boolean
  data: BackendReport[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface BackendExportResponse {
  success: boolean
  data: BackendReport
  message?: string
}

// ============================================================================
// Frontend Types (camelCase — transformed for UI)
// ============================================================================

export interface Report {
  id: string
  reportType: string
  reportTypeLabel: string
  merchant: string
  dateRange: string
  filterSummary: string
  requestedByEmail: string
  generatedAt: string
  completedAt: string
  status: ReportStatus
  canDownload: boolean
}

// ============================================================================
// Request Types
// ============================================================================

export interface ExportReportRequest {
  report_type: ReportType
  filters?: ExportFilters
}

export interface ExportFilters {
  merchant_id?: string
  payment_mode?: string
  mode?: string
  status?: string
  created_from?: string
  created_to?: string
  q?: string
  /** LEDGER report only: 'payout' | 'deposit' | 'all' (default all = combined). */
  tab?: string
  /** LEDGER report only: filter to one provider (UUID). */
  provider_id?: string
}

export interface ReportListParams {
  page?: number
  per_page?: number
  q?: string
}
