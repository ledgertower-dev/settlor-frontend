import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Team,
  Role,
  UserListParams,
  UserStatus,
  TeamWithJoinDate,
  RoleWithAssignDate,
} from '@/lib/types/api-types'

// Re-export the base types
export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Team,
  Role,
  UserListParams,
  UserStatus,
  TeamWithJoinDate,
  RoleWithAssignDate,
}

// Form data for create user dialog
export interface CreateUserFormData {
  name: string
  email: string
  phone: string
  role_id: string
  password: string
  confirmPassword: string
}

// Legacy types (used by UserDetail.tsx, EditUserModal.tsx, ProfileSelf.tsx)
export interface UpdateUserFormData {
  name: string
  role_id: string
  status: 'active' | 'inactive'
}

export interface UserProfileFormData {
  name: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TempPasswordData {
  password: string
  userId: string
  userName: string
}

export interface UserFormData {
  email: string
  name: string
  teamIds?: string[]
  roleIds?: string[]
  autoGeneratePassword?: boolean
}

export interface UserFilters {
  search: string
  status: UserStatus | 'all'
  page: number
  perPage: number
  sort: 'name' | 'email' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

export interface UserModalState {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  user?: User
}

export interface UserTableRow extends User {
  teamCount: number
  roleCount: number
}
