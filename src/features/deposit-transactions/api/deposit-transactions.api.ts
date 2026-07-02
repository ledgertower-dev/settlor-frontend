/**
 * Deposit Transactions API Service
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import { normalizePaginationMeta } from '@/lib/api/api-utils'

import type { Deposit, DepositMode, DepositStatus, GetDepositsParams } from '../types'

export interface CreateDepositRequest {
  amount: number
  from_bank_account_id: string
  mode: 'MANUAL'
  reference: string
  screenshot_upload_id: string
  virtual_account_id: string
}

export interface ApproveDepositRequest {
  remark: string
}

export interface RejectDepositRequest {
  remarks: string
}

export interface RevertDepositRequest {
  email: string
  password: string
  reason: string
}

interface BackendDeposit {
  id: string
  merchant_id: string
  merchant_name: string
  merchant_code: string
  status: DepositStatus
  mode: DepositMode
  amount: number
  currency: string
  reference: string
  from_bank: { bank_account_id: string } | null
  virtual_account_id: string
  screenshot_upload_id: string
  screenshot_url?: string
  created_at: string
  updated_at: string
  // Optional fields the create endpoint returns but the list endpoint omits:
  transaction_code?: string
  transaction_id?: string
  rejection_reason?: string
  review_remarks?: string
  reviewed_at?: string
  reviewed_by?: string
}

interface RawDepositsListResponse {
  success: boolean
  data: BackendDeposit[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface CreateDepositResponse {
  success: boolean
  data: BackendDeposit
}

export type DepositsListResponse = PaginatedResponse<Deposit>

function transformDeposit(b: BackendDeposit): Deposit {
  return {
    id: b.id,
    transactionCode: b.transaction_code ?? '',
    merchantId: b.merchant_id,
    merchantName: b.merchant_name,
    merchantCode: b.merchant_code,
    status: b.status,
    mode: b.mode,
    amount: b.amount,
    currency: b.currency,
    reference: b.reference,
    fromBank: b.from_bank ? { bankAccountId: b.from_bank.bank_account_id } : null,
    virtualAccountId: b.virtual_account_id,
    screenshotUploadId: b.screenshot_upload_id,
    screenshotUrl: b.screenshot_url ?? '',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

const normalizePagination = normalizePaginationMeta

function buildListQuery(params: GetDepositsParams = {}) {
  // Map camelCase → snake_case and drop empties so URLSearchParams stays clean.
  const out: Record<string, string | number> = {}
  if (params.status) out.status = params.status
  if (params.mode) out.mode = params.mode
  if (params.merchantId) out.merchant_id = params.merchantId
  if (params.q) out.q = params.q
  if (params.createdFrom) out.created_from = params.createdFrom
  if (params.createdTo) out.created_to = params.createdTo
  if (params.page) out.page = params.page
  if (params.perPage) out.per_page = params.perPage
  if (params.sort) out.sort = params.sort
  if (params.order) out.order = params.order
  return out
}

export interface DepositMetrics {
  total: { count: number; amount: number }
  pending: { count: number; amount: number }
  reverted: { count: number; amount: number }
  currency: string
  date: string
}

interface DepositMetricsResponse {
  success: boolean
  data: DepositMetrics
}

class DepositTransactionsService {
  async getMetrics(): Promise<DepositMetrics> {
    try {
      const response = await apiClient.get<DepositMetricsResponse>(
        '/deposits/dashboard/metrics/cards',
      )
      return response.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async getDeposits(params?: GetDepositsParams): Promise<DepositsListResponse> {
    try {
      const response = await apiClient.get<RawDepositsListResponse>('/deposits', {
        params: buildListQuery(params),
      })
      const raw = response.data
      return {
        data: { items: (raw.data ?? []).map(transformDeposit) },
        meta: { pagination: normalizePagination(raw.meta) },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async createDeposit(data: CreateDepositRequest): Promise<Deposit> {
    try {
      const response = await apiClient.post<CreateDepositResponse>('/deposits', data, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      })
      return transformDeposit(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async approveDeposit(id: string, data: ApproveDepositRequest): Promise<Deposit> {
    try {
      const response = await apiClient.post<CreateDepositResponse>(`/deposits/${id}/approve`, data)
      return transformDeposit(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async rejectDeposit(id: string, data: RejectDepositRequest): Promise<Deposit> {
    try {
      const response = await apiClient.post<CreateDepositResponse>(`/deposits/${id}/reject`, data)
      return transformDeposit(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async revertDeposit(id: string, data: RevertDepositRequest): Promise<Deposit> {
    try {
      const response = await apiClient.post<CreateDepositResponse>(`/deposits/${id}/revert`, data)
      return transformDeposit(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }
  /**
   * Export deposits as CSV (direct download for merchants)
   * GET /deposits/export
   */
  async exportCSV(params?: GetDepositsParams): Promise<void> {
    try {
      const filters: Record<string, string | number> = {}
      if (params?.status) filters.status = params.status
      if (params?.mode) filters.mode = params.mode
      if (params?.merchantId) filters.merchant_id = params.merchantId
      if (params?.q) filters.q = params.q
      if (params?.createdFrom) filters.created_from = params.createdFrom
      if (params?.createdTo) filters.created_to = params.createdTo

      const qp = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          qp.append(key, value.toString())
        }
      })
      const qs = qp.toString() ? `?${qp.toString()}` : ''

      const response = await apiClient.get<Blob>(`/deposits/export${qs}`, {
        responseType: 'blob',
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers?.['content-disposition']
      let fileName = 'deposits-export.csv'
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

export const depositTransactionsService = new DepositTransactionsService()
