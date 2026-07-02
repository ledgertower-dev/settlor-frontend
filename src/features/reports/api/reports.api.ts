/**
 * Reports API Service
 *
 * Connects to the backend for export report management
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import { toRFC3339DayStart, toRFC3339DayEnd } from '@/lib/core/format'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  Report,
  BackendReport,
  BackendReportsListResponse,
  BackendExportResponse,
  ExportReportRequest,
  ReportListParams,
  ReportStatus,
} from '../types'

// ============================================================================
// Transform helpers
// ============================================================================

function transformReport(backend: BackendReport): Report {
  return {
    id: backend.id,
    reportType: backend.report_type,
    reportTypeLabel: backend.report_type_label ?? backend.report_type,
    merchant: backend.merchant ?? '',
    dateRange: backend.date_range ?? '',
    filterSummary: backend.filter_summary ?? '',
    requestedByEmail: backend.requested_by_email ?? '',
    generatedAt: backend.generated_at,
    completedAt: backend.completed_at ?? '',
    status: backend.status as ReportStatus,
    canDownload: backend.can_download,
  }
}

// ============================================================================
// Service
// ============================================================================

class ReportsService {
  /**
   * List generated reports with pagination
   * GET /admin/reports
   */
  async getReports(params?: ReportListParams): Promise<PaginatedResponse<Report>> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              page: params.page,
              per_page: params.per_page,
              q: params.q,
            }
          : undefined,
      )
      const url = `/admin/reports${qs}`
      const response = await apiClient.get<BackendReportsListResponse>(url)

      const backendReports = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendReports) ? backendReports.map(transformReport) : []

      return {
        data: { items },
        meta: {
          pagination: normalizePaginationMeta(
            meta ?? { page: 1, per_page: 15, total: items.length, total_pages: 1 },
          ),
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Trigger a new report export
   * POST /admin/reports/exports
   */
  async exportReport(data: ExportReportRequest): Promise<Report> {
    try {
      const filters = data.filters ? { ...data.filters } : undefined
      if (filters?.created_from && !filters.created_from.includes('T')) {
        filters.created_from = toRFC3339DayStart(filters.created_from)
      }
      if (filters?.created_to && !filters.created_to.includes('T')) {
        filters.created_to = toRFC3339DayEnd(filters.created_to)
      }
      const payload = { ...data, filters }
      const response = await apiClient.post<BackendExportResponse>(
        '/admin/reports/exports',
        payload,
      )
      return transformReport(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Download a generated report
   * GET /admin/reports/:id/download
   */
  async downloadReport(id: string): Promise<void> {
    try {
      const response = await apiClient.get<Blob>(`/admin/reports/${id}/download`, {
        responseType: 'blob',
      })

      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Try to extract filename from content-disposition header
      const disposition = response.headers?.['content-disposition']
      let fileName = `report-${id}.csv`
      if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/)
        if (match?.[1]) fileName = match[1]
      }
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const reportsService = new ReportsService()
