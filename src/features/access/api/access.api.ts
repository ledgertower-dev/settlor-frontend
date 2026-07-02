/**
 * Access/Permissions API Service
 *
 * Provides access checking and permissions catalog functionality
 * Connects to the application RBAC backend at localhost:3001
 */

import apiClient from '@/lib/api/api-client'
import type { Permission } from '@/lib/types/api-types'

/**
 * API Response Types (matching backend format)
 */
interface ApiErrorResponse {
  success: boolean
  error: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
  timestamp?: string
}

/**
 * Backend Response Types (matching BACKEND_ENDPOINTS.md)
 *
 * GET /permissions returns grouped format:
 * { data: [{ group: "users", permissions: [{ id, key, description, group }] }] }
 */
interface BackendPermissionItem {
  id: string
  key: string
  description: string
  group: string
}

interface BackendPermissionGroup {
  group: string
  permissions: BackendPermissionItem[]
}

interface BackendPermissionsResponse {
  success: boolean
  data: BackendPermissionGroup[]
  timestamp?: string
}

interface BackendUserFilterResponse {
  success: boolean
  data: {
    items: Array<{
      id: string
      email: string
      name: string
    }>
  }
  meta?: {
    pagination: {
      page: number
      perPage: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
  timestamp?: string
}

interface BackendTeamFilterResponse {
  success: boolean
  data: {
    teams: Array<{
      id: string
      name: string
    }>
  }
  timestamp?: string
}

interface BackendRoleFilterResponse {
  success: boolean
  data: {
    roles: Array<{
      id: string
      name: string
    }>
  }
  timestamp?: string
}

/**
 * Access/Permissions Service
 */
class AccessService {
  /**
   * Transform a backend permission (group-based) to frontend Permission type
   */
  private transformPermission(p: BackendPermissionItem): Permission {
    // Backend key format: "resource:action" (e.g. "users:read")
    const [resource, action] = p.key.includes(':') ? p.key.split(':') : [p.group, p.key]
    return {
      id: p.id,
      key: p.key,
      name: p.key, // Backend doesn't have a separate name field
      description: p.description,
      resource: resource || p.group,
      action: action || '',
    }
  }

  /**
   * Get all permissions (read-only catalog)
   * Backend returns grouped format: { data: [{ group, permissions: [...] }] }
   */
  async getPermissions(accountType?: string): Promise<Permission[]> {
    try {
      const query = accountType ? `?account_type=${accountType}` : ''
      const response = await apiClient.get<BackendPermissionsResponse>(`/permissions${query}`)

      const groups = response.data?.data
      if (!Array.isArray(groups)) {
        throw new Error('Invalid API response: expected array of permission groups')
      }

      // Flatten all groups into a single permissions array
      return groups.flatMap(group => group.permissions.map(p => this.transformPermission(p)))
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } }
        if (axiosError.response?.data) {
          const apiError = axiosError.response.data as ApiErrorResponse
          throw new Error(apiError.error?.message || 'Failed to fetch permissions')
        }
      }
      throw new Error('Failed to fetch permissions.')
    }
  }

  /**
   * Get users for filter/selector (search support)
   */
  async getUsersForFilter(query: string = ''): Promise<
    Array<{
      id: string
      name: string
      email: string
    }>
  > {
    try {
      const queryParams = new URLSearchParams()
      if (query) queryParams.append('q', query)
      queryParams.append('perPage', '100')

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get<BackendUserFilterResponse>(url)

      // CRITICAL FIX: response.data.data.items (not response.data.data)
      return response.data.data.items.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }))
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } }
        if (axiosError.response?.data) {
          const apiError = axiosError.response.data as ApiErrorResponse
          throw new Error(apiError.error.message)
        }
      }
      throw new Error('Failed to fetch users.')
    }
  }

  /**
   * Get teams for filter/selector (search support)
   */
  async getTeamsForFilter(query: string = ''): Promise<
    Array<{
      id: string
      name: string
    }>
  > {
    try {
      const queryParams = new URLSearchParams()
      if (query) queryParams.append('q', query)

      const url = `/teams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get<BackendTeamFilterResponse>(url)

      // FIXED: response.data.data.teams (not response.data.teams)
      return response.data.data.teams
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } }
        if (axiosError.response?.data) {
          const apiError = axiosError.response.data as ApiErrorResponse
          throw new Error(apiError.error.message)
        }
      }
      throw new Error('Failed to fetch teams.')
    }
  }

  /**
   * Get roles for filter/selector (search support)
   */
  async getRolesForFilter(query: string = ''): Promise<
    Array<{
      id: string
      name: string
    }>
  > {
    try {
      const queryParams = new URLSearchParams()
      if (query) queryParams.append('q', query)

      const url = `/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get<BackendRoleFilterResponse>(url)

      // FIXED: response.data.data.roles (not response.data.roles)
      return response.data.data.roles
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } }
        if (axiosError.response?.data) {
          const apiError = axiosError.response.data as ApiErrorResponse
          throw new Error(apiError.error.message)
        }
      }
      throw new Error('Failed to fetch roles.')
    }
  }
}

// Export singleton instance
export const accessService = new AccessService()
