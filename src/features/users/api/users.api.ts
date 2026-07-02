/**
 * Users API Service
 *
 * Connects to the backend users API
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  BackendMutationResponse,
} from '@/lib/types/api-types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

/**
 * Backend Response Types (matching actual backend structure)
 */
interface BackendUser {
  id: string
  code: string
  name: string
  email: string
  phone: string
  role_id?: string
  role?: { id: string; name: string }
  account_type: string
  status: string // "ACTIVE", "PENDING", etc.
  email_verified: boolean
  phone_verified: boolean
  created_at: string
  updated_at: string
}

interface BackendUserListResponse {
  success: boolean
  data: BackendUser[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface BackendUserDetailResponse {
  success: boolean
  data: BackendUser
}

interface BackendCreateUserResponse {
  success: boolean
  data: BackendUser
  message?: string
}

/**
 * Transform backend user to frontend user
 */
function transformUser(backendUser: BackendUser): User {
  const statusMap: Record<string, User['status']> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    BLOCKED: 'blocked',
  }

  return {
    id: backendUser.id,
    code: backendUser.code,
    email: backendUser.email,
    name: backendUser.name,
    phone: backendUser.phone,
    roleId: backendUser.role?.id || backendUser.role_id,
    role: backendUser.role,
    accountType: backendUser.account_type,
    status: statusMap[backendUser.status] || 'inactive',
    emailVerified: backendUser.email_verified,
    phoneVerified: backendUser.phone_verified,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  }
}

/**
 * Users API Service
 */
class UsersService {
  /**
   * Get paginated list of users
   */
  async getUsers(params?: UserListParams): Promise<PaginatedResponse<User>> {
    try {
      const qs = buildFilterQueryString(
        params
          ? {
              q: params.q,
              status: params.status,
              page: params.page,
              per_page: params.perPage,
            }
          : undefined,
      )
      const url = `/users${qs}`
      const response = await apiClient.get<BackendUserListResponse>(url)

      const meta = response.data.meta

      return {
        data: {
          items: response.data.data.map(transformUser),
        },
        meta: {
          pagination: normalizePaginationMeta(meta),
        },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<{
    success: true
    data: { user: User }
  }> {
    try {
      const response = await apiClient.get<BackendUserDetailResponse>(`/users/${userId}`)

      return {
        success: true,
        data: { user: transformUser(response.data.data) },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<{
    success: true
    data: { user: User }
    message?: string
  }> {
    try {
      const response = await apiClient.post<BackendCreateUserResponse>('/users', data)

      return {
        success: true,
        data: { user: transformUser(response.data.data) },
        message: response.data.message || 'User created successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: UpdateUserRequest,
  ): Promise<{
    success: true
    data: { user: User }
    message?: string
  }> {
    try {
      const response = await apiClient.put<BackendCreateUserResponse>(`/users/${userId}`, data)

      return {
        success: true,
        data: { user: transformUser(response.data.data) },
        message: response.data.message || 'User updated successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<{
    success: true
    data: null
    message?: string
  }> {
    try {
      const response = await apiClient.post<BackendMutationResponse>(`/users/${userId}/block`)

      return {
        success: true,
        data: null,
        message: response.data.message || 'User blocked successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<{
    success: true
    data: null
    message?: string
  }> {
    try {
      const response = await apiClient.post<BackendMutationResponse>(`/users/${userId}/unblock`)

      return {
        success: true,
        data: null,
        message: response.data.message || 'User unblocked successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const usersService = new UsersService()
