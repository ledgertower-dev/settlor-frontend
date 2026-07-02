/**
 * Beneficiaries API Service
 *
 * Connects to the backend for beneficiary management
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  Beneficiary,
  BackendBeneficiary,
  BackendBeneficiariesListResponse,
  BackendBeneficiaryResponse,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
  BeneficiaryListParams,
} from '../types'

// ============================================================================
// Transform helpers
// ============================================================================

function transformBeneficiary(backend: BackendBeneficiary): Beneficiary {
  return {
    id: backend.id,
    beneficiaryName: backend.beneficiary_name,
    accountNumber: backend.account_number,
    ifsc: backend.ifsc,
    bankName: backend.bank_name,
    address: backend.address,
    status: backend.status,
    createdAt: backend.created_at,
  }
}

// ============================================================================
// Service
// ============================================================================

class BeneficiariesService {
  /**
   * List beneficiaries with pagination
   * GET /merchant/beneficiaries
   */
  async getBeneficiaries(params?: BeneficiaryListParams): Promise<PaginatedResponse<Beneficiary>> {
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
      const url = `/merchant/beneficiaries${qs}`
      const response = await apiClient.get<BackendBeneficiariesListResponse>(url)

      const backendItems = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendItems) ? backendItems.map(transformBeneficiary) : []

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
   * Create a new beneficiary
   * POST /merchant/beneficiaries
   */
  async createBeneficiary(data: CreateBeneficiaryRequest): Promise<Beneficiary> {
    try {
      const response = await apiClient.post<BackendBeneficiaryResponse>(
        '/merchant/beneficiaries',
        data,
        {
          headers: { 'Idempotency-Key': crypto.randomUUID() },
        },
      )
      return transformBeneficiary(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Update a beneficiary
   * PATCH /merchant/beneficiaries/:id
   */
  async updateBeneficiary(id: string, data: UpdateBeneficiaryRequest): Promise<Beneficiary> {
    try {
      const response = await apiClient.patch<BackendBeneficiaryResponse>(
        `/merchant/beneficiaries/${id}`,
        data,
      )
      return transformBeneficiary(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Delete a beneficiary
   * DELETE /merchant/beneficiaries/:id
   */
  async deleteBeneficiary(id: string): Promise<void> {
    try {
      await apiClient.delete(`/merchant/beneficiaries/${id}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Export beneficiaries as CSV
   * GET /merchant/beneficiaries/export?format=csv
   */
  async exportCSV(): Promise<void> {
    try {
      const response = await apiClient.get<Blob>('/merchant/beneficiaries/export?format=csv', {
        responseType: 'blob',
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers?.['content-disposition']
      let fileName = 'beneficiaries-export.csv'
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

export const beneficiariesService = new BeneficiariesService()
