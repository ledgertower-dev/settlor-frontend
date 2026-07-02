/**
 * Payouts API Service
 *
 * Connects to the backend for payout management
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import { toRFC3339DayStart, toRFC3339DayEnd } from '@/lib/core/format'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  Payout,
  PayoutDetail,
  PayoutBalance,
  PayoutTimeline,
  MerchantWallet,
  BackendPayout,
  BackendPayoutsListResponse,
  BackendPayoutDetailResponse,
  BackendPayoutBalanceResponse,
  BackendMerchantWallet,
  BackendMerchantWalletsResponse,
  CreatePayoutRequest,
  StatusOverrideRequest,
  PayoutListParams,
  PayoutStatus,
  PaymentMode,
} from '../types'

// ============================================================================
// Transform helpers
// ============================================================================

function transformTimeline(t: {
  from_status?: string | null
  to_status: string
  remarks?: string
  created_at: string
  event_type?: PayoutTimeline['eventType']
  badge?: PayoutTimeline['badge']
  request?: unknown
  response?: unknown
}): PayoutTimeline {
  return {
    fromStatus: t.from_status ?? null,
    toStatus: t.to_status,
    remarks: t.remarks ?? '',
    createdAt: t.created_at,
    eventType: t.event_type,
    badge: t.badge,
    request: t.request,
    response: t.response,
  }
}

function transformMerchantWallet(b: BackendMerchantWallet): MerchantWallet {
  return {
    id: b.wallet_id,
    walletCode: b.wallet_code,
    currency: b.currency,
    balance: b.balance,
    availableBalance: b.available_balance,
    holdBalance: b.hold_balance,
    status: b.status,
    priority: b.priority,
    providerId: b.provider_id,
    providerName: b.provider_name,
    providerCode: b.provider_code,
    virtualAccountId: b.virtual_account_id,
    isDefault: b.is_default,
  }
}

function transformPayout(backend: BackendPayout): Payout {
  return {
    id: backend.transaction_id,
    code: backend.transaction_code,
    status: backend.status as PayoutStatus,
    paymentMode: backend.payment_mode as PaymentMode,
    requestedAmount: backend.amount,
    fees: backend.fee,
    netAmount: backend.net_amount,
    utr: backend.utr ?? null,
    externalReference: backend.external_ref ?? null,
    remarks: backend.remarks ?? '',
    referenceId: backend.reference_id,
    providerStatus: backend.provider_status ?? null,
    beneficiary: backend.beneficiary
      ? {
          name: backend.beneficiary.name,
          account: backend.beneficiary.account,
          ifsc: backend.beneficiary.ifsc,
          bankName: backend.beneficiary.bank_name,
          address: backend.beneficiary.address,
        }
      : {
          name: backend.beneficiary_name ?? '',
          account: backend.beneficiary_account ?? '',
          ifsc: backend.beneficiary_ifsc ?? '',
          bankName: backend.bank_name ?? '',
          address: backend.beneficiary_address ?? '',
        },
    merchant: backend.merchant
      ? { id: backend.merchant.id, code: backend.merchant.code, name: backend.merchant.name }
      : {
          id: backend.merchant_id,
          code: backend.merchant_code ?? '',
          name: backend.merchant_name ?? '',
        },
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

function transformPayoutDetail(backend: BackendPayout): PayoutDetail {
  return {
    ...transformPayout(backend),
    timelines: backend.timelines?.map(transformTimeline) ?? [],
  }
}

// ============================================================================
// Service
// ============================================================================

class PayoutsService {
  /**
   * List payouts with pagination and filters
   * GET /payouts
   */
  async getPayouts(params?: PayoutListParams): Promise<PaginatedResponse<Payout>> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              page: params.page,
              per_page: params.per_page,
              sort: params.sort,
              order: params.order,
              status: params.status,
              payment_mode: params.payment_mode,
              created_from: params.created_from
                ? toRFC3339DayStart(params.created_from)
                : undefined,
              created_to: params.created_to ? toRFC3339DayEnd(params.created_to) : undefined,
              q: params.q,
              merchant_id: params.merchant_id,
            }
          : undefined,
      )
      const url = `/payouts${qs}`
      const response = await apiClient.get<BackendPayoutsListResponse>(url)

      const backendPayouts = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendPayouts) ? backendPayouts.map(transformPayout) : []

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
   * Get payout detail by ID
   * GET /payouts/:id
   */
  async getPayout(id: string): Promise<PayoutDetail> {
    try {
      const response = await apiClient.get<BackendPayoutDetailResponse>(`/payouts/${id}`)
      return transformPayoutDetail(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Get payout wallet balance
   * GET /payouts/balance
   */
  async getBalance(): Promise<PayoutBalance> {
    try {
      const response = await apiClient.get<BackendPayoutBalanceResponse>('/payouts/balance')
      const b = response.data.data.wallets[0]
      return {
        availableBalance: b?.available_balance ?? 0,
        balance: b?.balance ?? 0,
        currency: b?.currency ?? 'INR',
        holdBalance: b?.hold_balance ?? 0,
        walletId: b?.wallet_id ?? '',
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Create a new payout
   * POST /payouts
   */
  async createPayout(data: CreatePayoutRequest): Promise<Payout> {
    try {
      const response = await apiClient.post<BackendPayoutDetailResponse>('/payouts', data, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      })
      return transformPayout(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Export payouts as CSV (direct download for merchants)
   * GET /payouts/export
   */
  async exportCSV(params?: Omit<PayoutListParams, 'page' | 'per_page'>): Promise<void> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              status: params.status,
              payment_mode: params.payment_mode,
              created_from: params.created_from
                ? toRFC3339DayStart(params.created_from)
                : undefined,
              created_to: params.created_to ? toRFC3339DayEnd(params.created_to) : undefined,
              q: params.q,
            }
          : undefined,
      )
      const response = await apiClient.get<Blob>(`/payouts/export${qs}`, {
        responseType: 'blob',
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers?.['content-disposition']
      let fileName = 'payouts-export.csv'
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

  /**
   * Get merchant's wallets
   * GET /me/wallets
   */
  async getMyWallets(): Promise<MerchantWallet[]> {
    try {
      const response = await apiClient.get<BackendMerchantWalletsResponse>('/me/wallets')
      return (response.data.data?.wallets ?? []).map(transformMerchantWallet)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Override payout status (admin only)
   * POST /payouts/:id/status-override
   */
  async overrideStatus(payoutId: string, data: StatusOverrideRequest): Promise<PayoutDetail> {
    try {
      const response = await apiClient.post<BackendPayoutDetailResponse>(
        `/payouts/${payoutId}/status-override`,
        data,
      )
      return transformPayoutDetail(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const payoutsService = new PayoutsService()
