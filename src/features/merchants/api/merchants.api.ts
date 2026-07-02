import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { Merchant, MerchantDetail, MerchantStatus } from '../types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import { normalizePaginationMeta } from '@/lib/api/api-utils'

export interface GetMerchantsParams {
  status?: MerchantStatus
  kyc_status?: string
  q?: string
  page?: number
  per_page?: number
}

// Backend response shapes (snake_case)
interface BackendPrimaryWallet {
  provider_name: string
  provider_code: string
  currency: string
  balance: number
  status: string
}

interface BackendMerchant {
  id: string
  code: string
  name: string
  email: string
  phone?: string
  balance?: number
  primary_wallet?: BackendPrimaryWallet
  account_type: string
  status: MerchantStatus
  email_verified: boolean
  phone_verified: boolean
  created_at: string
  updated_at: string
  dob?: string
  gender?: string
  address?: string
}

interface RawMerchantsListResponse {
  success: boolean
  data: BackendMerchant[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Normalized response used by hooks/components
export type MerchantsListResponse = PaginatedResponse<Merchant>

interface BackendMerchantDetailResponse {
  success: boolean
  data: BackendMerchant
}

function transformMerchant(b: BackendMerchant): Merchant {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    email: b.email,
    phone: b.phone,
    balance: b.balance,
    primaryWallet: b.primary_wallet
      ? {
          providerName: b.primary_wallet.provider_name,
          providerCode: b.primary_wallet.provider_code,
          currency: b.primary_wallet.currency,
          balance: b.primary_wallet.balance,
          status: b.primary_wallet.status,
        }
      : undefined,
    accountType: b.account_type,
    status: b.status,
    emailVerified: b.email_verified,
    phoneVerified: b.phone_verified,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

function transformMerchantDetail(b: BackendMerchant): MerchantDetail {
  return {
    ...transformMerchant(b),
    dob: b.dob,
    gender: b.gender,
    address: b.address,
  }
}

const normalizePagination = normalizePaginationMeta

class MerchantsService {
  async getMerchants(params?: GetMerchantsParams): Promise<MerchantsListResponse> {
    try {
      const response = await apiClient.get<RawMerchantsListResponse>('/merchants', { params })
      const raw = response.data
      return {
        data: { items: raw.data.map(transformMerchant) },
        meta: { pagination: normalizePagination(raw.meta) },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async getMerchantDetail(id: string): Promise<{ success: boolean; data: MerchantDetail }> {
    try {
      const response = await apiClient.get<BackendMerchantDetailResponse>(`/merchants/${id}`)
      return {
        success: response.data.success,
        data: transformMerchantDetail(response.data.data),
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateMerchantStatus(
    id: string,
    status: MerchantStatus,
    remarks?: string,
  ): Promise<{ success: boolean; data: MerchantDetail }> {
    try {
      const response = await apiClient.patch<BackendMerchantDetailResponse>(
        `/merchants/${id}/status`,
        {
          status,
          ...(remarks && { remarks }),
        },
      )
      return {
        success: response.data.success,
        data: transformMerchantDetail(response.data.data),
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantsService = new MerchantsService()
