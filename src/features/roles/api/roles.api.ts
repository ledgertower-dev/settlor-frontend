/**
 * Roles API Service
 *
 * Connects to the application RBAC backend for role management
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildPaginationQueryString, normalizePaginationMeta } from '@/lib/api/api-utils'
import type { BasePaginationParams, PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  ApiSuccessResponse,
  BackendMutationResponse,
} from '@/lib/types/api-types'

/**
 * Pagination params for roles list
 */
export type RolePaginationParams = BasePaginationParams

/**
 * Backend API response formats (matching actual API)
 */

// Backend permission shape (snake_case)
interface BackendPermission {
  id: string
  key: string
  description: string
  account_type: string
  module: string
}

// Backend role shape (snake_case)
interface BackendRole {
  id: string
  account_type: string
  name: string
  description: string
  is_system: boolean
  permissions_editable: boolean
  permissions: BackendPermission[]
  created_at: string
}

interface BackendRolesListResponse {
  data: BackendRole[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface BackendRoleDetailResponse {
  data: BackendRole
  message?: string
}

// Internal response wrappers for service layer
interface RoleResponse {
  role: Role
  permissionIds: string[]
  message?: string
}

interface MessageResponse {
  message: string
}

/**
 * Transform backend role (snake_case) to frontend Role type
 */
function transformRole(backend: BackendRole): Role {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description || '',
    permissionCount: backend.permissions?.length ?? 0,
    isSystemLocked: backend.is_system,
    permissionsEditable: backend.permissions_editable ?? !backend.is_system,
    createdAt: backend.created_at,
    updatedAt: backend.created_at,
  }
}

/**
 * Roles Service
 */
class RolesService {
  /**
   * Get all roles with pagination
   * GET /roles
   */
  async getRoles(params?: RolePaginationParams): Promise<PaginatedResponse<Role>> {
    try {
      const queryString = buildPaginationQueryString(params)
      const response = await apiClient.get<BackendRolesListResponse>(`/roles${queryString}`)

      const backendRoles = response.data?.data ?? []
      const meta = response.data?.meta
      const items = Array.isArray(backendRoles) ? backendRoles.map(transformRole) : []

      return {
        data: {
          items,
        },
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
   * Get role by ID
   * GET /roles/:id
   */
  async getRole(roleId: string): Promise<ApiSuccessResponse<RoleResponse>> {
    try {
      const response = await apiClient.get<BackendRoleDetailResponse>(`/roles/${roleId}`)

      const backendRole = response.data?.data
      return {
        success: true,
        data: {
          role: transformRole(backendRole),
          permissionIds: backendRole.permissions?.map(p => p.id) ?? [],
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Create new role
   * POST /roles
   */
  async createRole(data: CreateRoleRequest): Promise<ApiSuccessResponse<RoleResponse>> {
    try {
      const response = await apiClient.post<BackendRoleDetailResponse>('/roles', data)

      const backendRole = response.data.data
      const message = response.data.message || 'Role created successfully'
      return {
        success: true,
        data: {
          role: transformRole(backendRole),
          permissionIds: backendRole.permissions?.map(p => p.id) ?? [],
          message,
        },
        message,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Update role
   * PATCH /roles/:id
   */
  async updateRole(
    roleId: string,
    data: UpdateRoleRequest,
  ): Promise<ApiSuccessResponse<RoleResponse>> {
    try {
      const response = await apiClient.patch<BackendRoleDetailResponse>(`/roles/${roleId}`, data)

      const updatedRole = response.data.data
      const message = response.data.message || 'Role updated successfully'
      return {
        success: true,
        data: {
          role: transformRole(updatedRole),
          permissionIds: updatedRole.permissions?.map(p => p.id) ?? [],
          message,
        },
        message,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Delete role
   * DELETE /roles/:id
   */
  async deleteRole(roleId: string): Promise<ApiSuccessResponse<MessageResponse>> {
    try {
      const response = await apiClient.delete<BackendMutationResponse>(`/roles/${roleId}`)

      return {
        success: true,
        data: {
          message: response.data.message || 'Role deleted successfully',
        },
        message: response.data.message || 'Role deleted successfully',
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Update role permissions
   * PUT /roles/:id
   */
  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsRequest,
  ): Promise<ApiSuccessResponse<MessageResponse>> {
    try {
      const response = await apiClient.put<BackendMutationResponse>(`/roles/${roleId}`, {
        permission_ids: data.permissionIds,
      })

      return {
        success: true,
        data: {
          message: response.data.message || 'Role permissions updated successfully',
        },
        message: response.data.message || 'Role permissions updated successfully',
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const rolesService = new RolesService()
