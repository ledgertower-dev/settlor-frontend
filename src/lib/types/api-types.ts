/**
 * Shared API Type Definitions
 *
 * Core types used across all feature modules for API communication
 */

import type { PaginationMeta } from './pagination.types'

// ============================================================================
// Common Types
// ============================================================================

// Note: Backend uses isActive: boolean, Frontend uses status: 'active' | 'inactive'
// Transformations happen at API layer

// ============================================================================
// Base Entity Types
// ============================================================================

export interface RoleSummary {
  id: string
  name: string
}

export interface User {
  id: string
  code?: string
  email: string
  name: string
  phone?: string
  roleId?: string
  role?: RoleSummary
  accountType?: string // "ADMIN", "MERCHANT", etc.
  status: 'active' | 'inactive' | 'pending' | 'blocked' // Frontend field - transformed from backend
  mustChangePassword?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  roles?: RoleSummary[]
  dob?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  avatarUrl?: string
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  adminPasswordResetNotice?: {
    show: boolean
    message: string
  }
}

export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  isSystemLocked: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissionCount: number
  userCount?: number
  teamCount?: number
  isSystemLocked: boolean
  permissionsEditable: boolean
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  key: string
  name: string
  description: string
  resource: string
  action: string
}

// ============================================================================
// Extended Entity Types
// ============================================================================

export interface TeamWithJoinDate extends Omit<Team, 'memberCount'> {
  joinedAt: string
}

export interface TeamMember {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' // Frontend field
  joinedAt: string
}

export interface RoleWithAssignDate extends Omit<
  Role,
  'permissionCount' | 'userCount' | 'teamCount'
> {
  assignedAt: string
}

export interface PermissionWithAssignDate extends Permission {
  assignedAt: string
}

export interface EffectivePermission {
  permission: Permission
  granted: boolean
  path: string
}

export interface UserWithRoleAssignment {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' // Frontend field
  assignedAt: string
  assignmentType: 'direct' | 'team'
  assignedThrough: {
    id: string
    name: string
  } | null
}

export interface TeamWithRoleAssignment {
  id: string
  name: string
  description: string
  memberCount: number
  isSystemLocked: boolean
  assignedAt: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateUserRequest {
  email: string
  name: string
  phone: string
  password: string
  role_id: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
  role_id?: string
  password?: string
  status?: 'active' | 'inactive' // Frontend field, transformed to isActive in API layer
}

export interface CreateTeamRequest {
  name: string
  description?: string // Optional per backend DTO
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
  account_type: string
  permission_ids: string[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface AddTeamMembersRequest {
  userIds: string[]
}

export interface AddTeamRolesRequest {
  roleIds: string[]
}

export interface UpdateUserTeamsRequest {
  teamIds: string[]
}

export interface UpdateUserRolesRequest {
  roleIds: string[]
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[]
}

export interface AccessCheckRequest {
  userId: string
  resource: string
  action: string
}

// ============================================================================
// Pagination Types
// ============================================================================

// Re-export the canonical PaginationMeta from pagination.types
export type { PaginationMeta } from './pagination.types'

export interface UserListParams {
  q?: string
  status?: string
  page?: number
  perPage?: number
  sort?: 'name' | 'email' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface RoleUsersParams {
  q?: string
  page?: number
  perPage?: number
}

export interface RoleTeamsParams {
  q?: string
  page?: number
  perPage?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: boolean
  data: T
  meta?: { pagination: PaginationMeta }
  message?: string
  timestamp?: string
}

export interface ApiErrorResponse {
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

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/** Standard backend response for mutations (create/update/delete) with no data payload */
export interface BackendMutationResponse {
  success: boolean
  data: null
  message?: string
  timestamp?: string
}

// ============================================================================
// Type Aliases for UI Components
// ============================================================================

// For backward compatibility with UI filters
export type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked'
