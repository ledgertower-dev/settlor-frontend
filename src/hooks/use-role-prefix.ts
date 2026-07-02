'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

const VALID_ROLES = ['admin', 'merchant'] as const
export type RolePrefix = (typeof VALID_ROLES)[number]

/**
 * Extracts the role prefix from the current URL pathname.
 * e.g. "/admin/dashboard" → "admin", "/merchant/payout-transactions" → "merchant"
 */
export function useRolePrefix(): RolePrefix {
  const pathname = usePathname()
  return getRolePrefixFromPath(pathname)
}

/**
 * Returns a function that prefixes a relative path with the current role.
 * e.g. useRolePath() → fn("/dashboard") → "/admin/dashboard"
 */
export function useRolePath(): (path: string) => string {
  const role = useRolePrefix()
  return useCallback((path: string) => `/${role}${path}`, [role])
}

/**
 * Extract role prefix from a pathname string (non-hook utility).
 */
export function getRolePrefixFromPath(pathname: string): RolePrefix {
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  if (firstSegment && VALID_ROLES.includes(firstSegment as RolePrefix)) {
    return firstSegment as RolePrefix
  }
  return 'admin' // fallback
}

/**
 * Strip the role prefix from a pathname to get the "inner" path.
 * e.g. "/admin/dashboard" → "/dashboard", "/merchant/roles/123" → "/roles/123"
 */
export function stripRolePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0 && VALID_ROLES.includes(segments[0] as RolePrefix)) {
    return '/' + segments.slice(1).join('/')
  }
  return pathname
}

/**
 * Check if a role string is valid.
 */
export function isValidRole(role: string): role is RolePrefix {
  return VALID_ROLES.includes(role as RolePrefix)
}

/**
 * Map account type from API (e.g. "ADMIN", "MERCHANT") to role prefix.
 */
export function accountTypeToRolePrefix(accountType?: string): RolePrefix {
  if (!accountType) return 'admin'
  return accountType.toLowerCase() === 'merchant' ? 'merchant' : 'admin'
}
