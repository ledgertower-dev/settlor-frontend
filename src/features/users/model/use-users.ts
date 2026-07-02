/**
 * Users TanStack Query Hooks
 *
 * Provides React Query hooks for user management operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { usersService } from '../api/users.api'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type {
  User,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/lib/types/api-types'

// ============================================================================
// Query Keys
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// ============================================================================
// Response Types
// ============================================================================

interface UserDetailResponse {
  user: User
}

interface CreateUserResponse {
  user: User
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get paginated list of users
 */
export function useUsers(
  params?: UserListParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PaginatedResponse<User>, Error>({
    queryKey: [...userKeys.all, params] as const,
    queryFn: () => usersService.getUsers(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/**
 * Get single user by ID
 */
export function useUser(
  id: string | undefined,
  options?: Omit<UseQueryOptions<UserDetailResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<UserDetailResponse, Error>({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('User ID is required')
      const response = await usersService.getUser(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new user
 */
export function useCreateUser(
  options?: UseMutationOptions<CreateUserResponse, Error, CreateUserRequest>,
) {
  const queryClient = useQueryClient()

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await usersService.createUser(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    ...options,
  })
}

/**
 * Block user
 */
export function useBlockUser(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (userId: string) => {
      await usersService.blockUser(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    ...options,
  })
}

/**
 * Unblock user
 */
export function useUnblockUser(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (userId: string) => {
      await usersService.unblockUser(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    ...options,
  })
}

/**
 * Update an existing user
 */
export function useUpdateUser(
  options?: UseMutationOptions<
    UserDetailResponse,
    Error,
    { userId: string; data: UpdateUserRequest }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation<UserDetailResponse, Error, { userId: string; data: UpdateUserRequest }>({
    mutationFn: async ({ userId, data }) => {
      const response = await usersService.updateUser(userId, data)
      return { user: response.data.user }
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
    },
    ...options,
  })
}
