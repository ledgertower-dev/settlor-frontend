import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type { WalletAdjustment, CreateAdjustmentPayload, MerchantWallet } from '../types'

export interface GetAllAdjustmentsParams {
  page?: number
  per_page?: number
  direction?: 'CREDIT' | 'DEBIT'
  merchant_id?: string
  wallet_id?: string
  search?: string
  from?: string
  to?: string
}

export interface GetAdjustmentsParams {
  page?: number
  per_page?: number
}

// Backend response shapes (snake_case)
interface BackendWalletAdjustment {
  id: string
  merchant_id: string
  wallet_id: string
  direction: 'CREDIT' | 'DEBIT'
  amount: number
  currency: string
  remarks: string
  ledger_entry_id: number
  created_by: string
  status: string
  created_at: string
  merchant_name: string
  merchant_code: string
  merchant_email: string
  wallet_code: string
}

interface RawAdjustmentsListResponse {
  success: boolean
  data: BackendWalletAdjustment[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface CreateAdjustmentResponse {
  success: boolean
  data: BackendWalletAdjustment
}

interface BackendMerchantWallet {
  wallet_id: string
  wallet_code: string
  name: string
  status: string
  currency: string
  provider_id: string
  provider_name: string
  virtual_account_id: string
  va_code: string
  priority: number
  available: number
  hold: number
  balance: number
}

interface BackendMerchantWalletsResponse {
  success: boolean
  data: BackendMerchantWallet[]
}

function transformMerchantWallet(b: BackendMerchantWallet): MerchantWallet {
  return {
    walletId: b.wallet_id,
    walletCode: b.wallet_code,
    name: b.name,
    status: b.status,
    currency: b.currency,
    providerName: b.provider_name,
    available: b.available,
    hold: b.hold,
    balance: b.balance,
  }
}

export type AdjustmentsListResponse = PaginatedResponse<WalletAdjustment>

function transformAdjustment(b: BackendWalletAdjustment): WalletAdjustment {
  return {
    id: b.id,
    merchantId: b.merchant_id,
    walletId: b.wallet_id,
    direction: b.direction,
    amount: b.amount,
    currency: b.currency,
    remarks: b.remarks,
    ledgerEntryId: b.ledger_entry_id,
    createdBy: b.created_by,
    status: b.status,
    createdAt: b.created_at,
    merchantName: b.merchant_name,
    merchantCode: b.merchant_code,
    merchantEmail: b.merchant_email,
    walletCode: b.wallet_code,
  }
}

class WalletAdjustmentsService {
  /** Get wallets for a merchant */
  async getMerchantWallets(merchantId: string): Promise<MerchantWallet[]> {
    try {
      const response = await apiClient.get<BackendMerchantWalletsResponse>(
        `/admin/merchants/${merchantId}/wallets`,
      )
      return (response.data.data ?? []).map(transformMerchantWallet)
    } catch (error) {
      throwApiError(error)
    }
  }

  /** List all adjustment logs (admin-level, paginated) */
  async getAllAdjustments(params?: GetAllAdjustmentsParams): Promise<AdjustmentsListResponse> {
    try {
      const response = await apiClient.get<RawAdjustmentsListResponse>(
        '/admin/wallet-adjustments',
        { params },
      )
      const raw = response.data
      return {
        data: { items: raw.data.map(transformAdjustment) },
        meta: { pagination: normalizePaginationMeta(raw.meta) },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /** List adjustments for a specific merchant wallet */
  async getAdjustments(
    merchantId: string,
    walletId: string,
    params?: GetAdjustmentsParams,
  ): Promise<AdjustmentsListResponse> {
    try {
      const response = await apiClient.get<RawAdjustmentsListResponse>(
        `/admin/merchants/${merchantId}/wallets/${walletId}/adjustments`,
        { params },
      )
      const raw = response.data
      return {
        data: { items: raw.data.map(transformAdjustment) },
        meta: { pagination: normalizePaginationMeta(raw.meta) },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async createAdjustment(
    merchantId: string,
    walletId: string,
    payload: CreateAdjustmentPayload,
  ): Promise<{ success: boolean; data: WalletAdjustment }> {
    try {
      const response = await apiClient.post<CreateAdjustmentResponse>(
        `/admin/merchants/${merchantId}/wallets/${walletId}/adjustments`,
        payload,
      )
      return {
        success: response.data.success,
        data: transformAdjustment(response.data.data),
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const walletAdjustmentsService = new WalletAdjustmentsService()
