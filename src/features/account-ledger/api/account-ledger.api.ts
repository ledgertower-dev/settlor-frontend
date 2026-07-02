/**
 * Account Ledger API Service
 *
 * GET /ledger — list account ledger (wallet operations). The backend enforces
 * merchant self-scope; admins may filter by merchant_id.
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import { normalizePaginationMeta } from '@/lib/api/api-utils'

import type { GetLedgerParams, LedgerEntry } from '../types'

interface BackendLedgerEntry {
  date: string
  merchant_id: string
  merchant_name: string
  merchant_code: string
  transaction_id: string
  mode: string
  transaction_type: string
  amount: number
  service_fees: number
  opening_balance: number
  closing_balance: number
  currency: string
}

interface RawLedgerListResponse {
  success: boolean
  data: BackendLedgerEntry[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export type LedgerListResponse = PaginatedResponse<LedgerEntry>

function transformEntry(b: BackendLedgerEntry): LedgerEntry {
  return {
    date: b.date,
    merchantId: b.merchant_id,
    merchantName: b.merchant_name,
    merchantCode: b.merchant_code,
    transactionId: b.transaction_id,
    mode: b.mode,
    transactionType: b.transaction_type,
    amount: b.amount,
    serviceFees: b.service_fees,
    openingBalance: b.opening_balance,
    closingBalance: b.closing_balance,
    currency: b.currency,
  }
}

function buildListQuery(params: GetLedgerParams = {}) {
  const out: Record<string, string | number> = {}
  if (params.tab) out.tab = params.tab
  if (params.q) out.q = params.q
  if (params.merchantId) out.merchant_id = params.merchantId
  if (params.providerId) out.provider_id = params.providerId
  if (params.dateFrom) out.date_from = params.dateFrom
  if (params.dateTo) out.date_to = params.dateTo
  if (params.page) out.page = params.page
  if (params.perPage) out.per_page = params.perPage
  if (params.order) out.order = params.order
  return out
}

class AccountLedgerService {
  async getLedger(params?: GetLedgerParams): Promise<LedgerListResponse> {
    try {
      const response = await apiClient.get<RawLedgerListResponse>('/ledger', {
        params: buildListQuery(params),
      })
      const raw = response.data
      return {
        data: { items: (raw.data ?? []).map(transformEntry) },
        meta: { pagination: normalizePaginationMeta(raw.meta) },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Export the account ledger as CSV (direct download).
   * GET /ledger/export — same filters + scoping as GET /ledger. Works for both
   * admins (may filter by merchant_id) and merchants (self-scoped). Gated by
   * ledger:export / merchant:ledger:export on the backend.
   */
  async exportCSV(params?: Omit<GetLedgerParams, 'page' | 'perPage'>): Promise<void> {
    try {
      const response = await apiClient.get<Blob>('/ledger/export', {
        params: buildListQuery(params),
        responseType: 'blob',
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers?.['content-disposition']
      let fileName = 'account-ledger-export.csv'
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

export const accountLedgerService = new AccountLedgerService()
