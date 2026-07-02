/**
 * Universal Permission Hook
 *
 * Provides utility hooks for checking user permissions
 * Reads permissions directly from the auth store (populated by /auth/me)
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth'

/**
 * Check if user has specific permission(s)
 *
 * Supports both single permission and multiple permissions (OR logic)
 *
 * @param permissionKey - Single permission key or array of permission keys
 * @returns boolean indicating if user has the permission(s)
 *
 * @example
 * ```tsx
 * // Single permission
 * const canViewUsers = usePermission('users:read')
 *
 * // Multiple permissions (OR logic) - user needs ANY of these
 * const canViewStores = usePermission(['stores:all:read', 'stores:assigned:read'])
 * ```
 */
export function usePermission(permissionKey: string | string[] | undefined): boolean {
  const { user } = useAuthStore()

  return useMemo(() => {
    if (!user?.permissions || permissionKey === undefined) {
      return false
    }

    const userPermissionKeys = new Set(user.permissions)
    const isMerchant = user.accountType === 'MERCHANT'

    /** merchant:-prefixed permissions are only available to merchant users */
    const canUse = (key: string) => {
      if (key.startsWith('merchant:') && !isMerchant) return false
      return userPermissionKeys.has(key)
    }

    // Single permission check
    if (typeof permissionKey === 'string') {
      return canUse(permissionKey)
    }

    // Multiple permissions - user needs at least one (OR logic)
    return permissionKey.some(canUse)
  }, [user, permissionKey])
}

/**
 * Get all user's permission keys as a Set
 *
 * Useful for complex permission logic
 *
 * @returns Set of permission keys the user has
 *
 * @example
 * ```tsx
 * const permissions = useUserPermissionKeys()
 * const hasMultiplePermissions = permissions.has('users:read') && permissions.has('users:write')
 * ```
 */
export function useUserPermissionKeys(): Set<string> {
  const { user } = useAuthStore()

  return useMemo(() => {
    if (!user?.permissions) {
      return new Set<string>()
    }
    return new Set(user.permissions)
  }, [user])
}

/**
 * Check if permissions are still loading
 *
 * @returns boolean - always false since permissions come from auth store
 */
export function usePermissionsLoading(): boolean {
  return false
}

/**
 * Check if the current user has a specific role
 *
 * @param roleName - Role name to check against (e.g. 'Support Member')
 * @returns boolean indicating if user has the role
 *
 * @example
 * ```tsx
 * const isSupportMember = useRole('Support Member')
 * ```
 */
export function useRole(roleName: string): boolean {
  const { user } = useAuthStore()
  return useMemo(() => user?.role?.name === roleName, [user?.role?.name, roleName])
}
