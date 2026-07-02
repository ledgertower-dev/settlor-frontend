/**
 * React Query Hooks for Roles Feature
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService, type RolePaginationParams } from '../api/roles.api'
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
} from '@/lib/types/api-types'

// ============================================================================
// Query Keys
// ============================================================================

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params: object) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all roles with pagination
 */
export const useRoles = (params?: RolePaginationParams) =>
  useQuery({
    queryKey: roleKeys.list(params ?? {}),
    queryFn: () => rolesService.getRoles(params),
  })

/**
 * Fetch single role by ID
 */
export const useRole = (id: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: roleKeys.detail(id ?? ''),
    queryFn: () => rolesService.getRole(id!),
    enabled: (options?.enabled ?? true) && !!id,
  })

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new role
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}

/**
 * Update existing role
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesService.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
    },
  })
}

/**
 * Delete role
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rolesService.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: roleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

/**
 * Update role permissions
 */
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRolePermissionsRequest }) =>
      rolesService.updateRolePermissions(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}
