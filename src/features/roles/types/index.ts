// Re-export types from shared types
export type {
  Role,
  RoleWithAssignDate,
  Permission,
  PermissionWithAssignDate,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
} from '@/lib/types/api-types'

// Import for local use
import type { Role, Permission } from '@/lib/types/api-types'

// Additional types for role management
export type RoleTableRow = Role

export interface RoleFormData {
  name: string
  description: string
}

export interface UpdateRoleFormData {
  name?: string
  description?: string
}

export interface RoleModalState {
  createModalOpen: boolean
  editModalOpen: boolean
  deleteDialogOpen: boolean
  selectedRole: Role | null
}

export interface RoleFilters {
  search: string
  page: number
  perPage: number
}

export interface PermissionGroup {
  resource: string
  permissions: Permission[]
}

export interface RolePermissionAssignment {
  permissionId: string
  assigned: boolean
}
