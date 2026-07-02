/**
 * Profile TanStack Query Hooks
 *
 * Provides React Query hooks for authenticated user's profile operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { authService } from '../api/auth.api'
import { useAuthStore } from './auth.store'
import type { User, ChangePasswordRequest } from '../types'

// ============================================================================
// Query Keys
// ============================================================================

export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
}

// ============================================================================
// Response Types
// ============================================================================

interface UpdateProfileRequest {
  name?: string
  email?: string
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get current authenticated user's profile
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<User, Error>({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const user = await authService.getCurrentUser()

      // Sync Zustand auth store with fresh API data
      // This ensures sidebar and other components using useAuthStore stay in sync
      useAuthStore.setState({ user, isAuthenticated: true })

      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update current user's profile (name, email)
 */
export function useUpdateProfile(
  options?: Omit<UseMutationOptions<User, Error, UpdateProfileRequest>, 'mutationFn' | 'onSuccess'>,
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      return await authService.updateMe(data)
    },
    onSuccess: data => {
      // Update the current user profile in cache
      queryClient.setQueryData(profileKeys.current(), data)

      // Sync Zustand auth store with updated user data
      useAuthStore.setState({ user: { ...data } })
    },
    ...options,
  })
}

/**
 * Change current user's password
 */
export function useChangePasswordMutation(
  options?: Omit<
    UseMutationOptions<void, Error, ChangePasswordRequest>,
    'mutationFn' | 'onSuccess'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: async (data: ChangePasswordRequest) => {
      await authService.changePassword(data)
    },
    onSuccess: async () => {
      // Invalidate current user to refresh mustChangePassword flag
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
    ...options,
  })
}
