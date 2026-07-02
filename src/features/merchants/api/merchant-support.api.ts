import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginationMeta } from '@/lib/types/pagination.types'
import type {
  SupportMember,
  SupportMemberListParams,
  AssignSupportMembersRequest,
} from '../types/merchant-support.types'

// Backend response shape (snake_case)
interface BackendSupportMember {
  id: string
  code: string
  name: string
  email: string
  phone: string
  status: string
  created_at: string
}

interface SupportMemberListResponse {
  data: BackendSupportMember[]
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface AssignedSupportMembersResponse {
  data: BackendSupportMember[]
}

function transformSupportMember(b: BackendSupportMember): SupportMember {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    email: b.email,
    phone: b.phone,
    status: b.status,
    createdAt: b.created_at,
  }
}

class MerchantSupportService {
  async getSupportMembers(
    params?: SupportMemberListParams,
  ): Promise<{ data: { items: SupportMember[] }; meta: { pagination: PaginationMeta } }> {
    try {
      const response = await apiClient.get<SupportMemberListResponse>('/support-members', {
        params,
      })
      const items = response.data.data.map(transformSupportMember)
      const meta = response.data.meta
      return {
        data: { items },
        meta: {
          pagination: meta
            ? normalizePaginationMeta(meta)
            : {
                page: params?.page ?? 1,
                perPage: params?.per_page ?? items.length,
                total: items.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async getAssignedSupportMembers(merchantId: string): Promise<SupportMember[]> {
    try {
      const response = await apiClient.get<AssignedSupportMembersResponse>(
        `/merchants/${merchantId}/support-members`,
      )
      return response.data.data.map(transformSupportMember)
    } catch (error) {
      throwApiError(error)
    }
  }

  async assignSupportMembers(
    merchantId: string,
    supportUserIds: string[],
  ): Promise<SupportMember[]> {
    try {
      const body: AssignSupportMembersRequest = { support_user_ids: supportUserIds }
      const response = await apiClient.put<AssignedSupportMembersResponse>(
        `/merchants/${merchantId}/support-members`,
        body,
      )
      return response.data.data.map(transformSupportMember)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantSupportService = new MerchantSupportService()
