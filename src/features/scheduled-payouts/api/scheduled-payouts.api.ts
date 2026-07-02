/**
 * Scheduled Payouts API Service
 *
 * Connects to the backend for scheduled payout management
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  ScheduledPayoutListItem,
  ScheduledPayoutDetail,
  BackendScheduledPayoutsListResponse,
  BackendScheduledPayoutDetailResponse,
  BackendScheduledPayoutListItem,
  BackendScheduledPayoutDetail,
  BackendRunHistoryResponse,
  RunHistoryData,
  CreateScheduledPayoutRequest,
  UpdateScheduledPayoutRequest,
  ScheduledPayoutListParams,
  ScheduledPayoutStatus,
  Frequency,
  EndCondition,
  MonthMode,
} from '../types'

// ============================================================================
// Transform helpers
// ============================================================================

function transformListItem(b: BackendScheduledPayoutListItem): ScheduledPayoutListItem {
  return {
    id: b.id,
    name: b.name,
    paymentMode: b.payment_mode,
    walletId: b.wallet_id,
    amount: b.amount,
    currency: b.currency,
    recipient: b.recipient,
    frequency: b.frequency,
    frequencyLabel: b.frequency_label,
    nextRunAt: b.next_run_at,
    status: b.status as ScheduledPayoutStatus,
  }
}

function transformDetail(b: BackendScheduledPayoutDetail): ScheduledPayoutDetail {
  return {
    id: b.id,
    name: b.name,
    paymentMode: b.payment_mode,
    walletId: b.wallet_id,
    amount: b.amount,
    currency: b.currency,
    beneficiary: {
      name: b.beneficiary.name,
      account: b.beneficiary.account,
      ifsc: b.beneficiary.ifsc,
      bankName: b.beneficiary.bank_name,
      address: b.beneficiary.address,
    },
    referenceId: b.reference_id,
    remarks: b.remarks,
    schedule: {
      frequency: b.schedule.frequency as Frequency,
      executionTime: b.schedule.execution_time,
      startDate: b.schedule.start_date,
      dayOfWeek: b.schedule.day_of_week,
      dayOfMonth: b.schedule.day_of_month,
      monthMode: b.schedule.month_mode as MonthMode | null,
      intervalDays: b.schedule.interval_days,
      endCondition: b.schedule.end_condition as EndCondition,
      endAfterOccurrences: b.schedule.end_after_occurrences,
      endOnDate: b.schedule.end_on_date,
      timezone: b.schedule.timezone,
    },
    frequencyLabel: b.frequency_label,
    nextRunAt: b.next_run_at,
    lastRunAt: b.last_run_at,
    occurrencesCount: b.occurrences_count,
    status: b.status as ScheduledPayoutStatus,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

// ============================================================================
// Service
// ============================================================================

class ScheduledPayoutsService {
  /**
   * List scheduled payouts with pagination and filters
   * GET /scheduled-payouts
   */
  async getScheduledPayouts(
    params?: ScheduledPayoutListParams,
  ): Promise<PaginatedResponse<ScheduledPayoutListItem>> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              page: params.page,
              per_page: params.per_page,
              type: params.type,
              status: params.status,
              frequency: params.frequency,
              q: params.q,
            }
          : undefined,
      )
      const url = `/scheduled-payouts${qs}`
      const response = await apiClient.get<BackendScheduledPayoutsListResponse>(url)

      const backendItems = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendItems) ? backendItems.map(transformListItem) : []

      return {
        data: { items },
        meta: {
          pagination: normalizePaginationMeta(
            meta ?? { page: 1, per_page: 10, total: items.length, total_pages: 1 },
          ),
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Get scheduled payout detail by ID
   * GET /scheduled-payouts/:id
   */
  async getScheduledPayout(id: string): Promise<ScheduledPayoutDetail> {
    try {
      const response = await apiClient.get<BackendScheduledPayoutDetailResponse>(
        `/scheduled-payouts/${id}`,
      )
      return transformDetail(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Create a new scheduled payout
   * POST /scheduled-payouts
   */
  async createScheduledPayout(data: CreateScheduledPayoutRequest): Promise<ScheduledPayoutDetail> {
    try {
      const response = await apiClient.post<BackendScheduledPayoutDetailResponse>(
        '/scheduled-payouts',
        data,
        { headers: { 'Idempotency-Key': crypto.randomUUID() } },
      )
      return transformDetail(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Update a scheduled payout
   * PUT /scheduled-payouts/:id
   */
  async updateScheduledPayout(
    id: string,
    data: UpdateScheduledPayoutRequest,
  ): Promise<ScheduledPayoutDetail> {
    try {
      const response = await apiClient.put<BackendScheduledPayoutDetailResponse>(
        `/scheduled-payouts/${id}`,
        data,
      )
      return transformDetail(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Pause a scheduled payout
   * POST /scheduled-payouts/:id/pause
   */
  async pauseScheduledPayout(id: string): Promise<void> {
    try {
      await apiClient.post(`/scheduled-payouts/${id}/pause`)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Resume a scheduled payout
   * POST /scheduled-payouts/:id/resume
   */
  async resumeScheduledPayout(id: string): Promise<void> {
    try {
      await apiClient.post(`/scheduled-payouts/${id}/resume`)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Cancel a scheduled payout
   * POST /scheduled-payouts/:id/cancel
   */
  async cancelScheduledPayout(id: string): Promise<void> {
    try {
      await apiClient.post(`/scheduled-payouts/${id}/cancel`)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Get run history for a scheduled payout
   * GET /scheduled-payouts/:id/history
   */
  async getRunHistory(id: string): Promise<RunHistoryData> {
    try {
      const response = await apiClient.get<BackendRunHistoryResponse>(
        `/scheduled-payouts/${id}/history`,
      )
      const d = response.data.data
      return {
        runs: d.runs.map(r => ({
          amount: r.amount,
          currency: r.currency,
          ranAt: r.ran_at,
          status: r.status,
          transactionCode: r.transaction_code,
          transactionId: r.transaction_id,
          utr: r.utr,
          errorCode: r.error_code,
          failureReason: r.failure_reason,
        })),
        schedule: {
          id: d.schedule.id,
          name: d.schedule.name,
          amount: d.schedule.amount,
          currency: d.schedule.currency,
          frequency: d.schedule.frequency,
          frequencyLabel: d.schedule.frequency_label,
          nextRunAt: d.schedule.next_run_at,
          paymentMode: d.schedule.payment_mode,
          recipient: d.schedule.recipient,
          status: d.schedule.status,
          walletId: d.schedule.wallet_id,
        },
        stats: {
          totalRuns: d.stats.total_runs,
          successful: d.stats.successful,
          failed: d.stats.failed,
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const scheduledPayoutsService = new ScheduledPayoutsService()
