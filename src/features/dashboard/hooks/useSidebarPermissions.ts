/**
 * Sidebar Permissions Hook
 *
 * Manages permission-based visibility for sidebar navigation items
 * Reads permissions directly from the auth store (populated by /auth/me)
 */

import { useMemo, useCallback } from 'react'
import { useAuthStore } from '@/features/auth'

// Sidebar item permission configuration
// Each item maps to required permission(s)
// undefined = always visible (no permission required)
// string = single permission required
// string[] = any one of the permissions required (OR logic)
const SIDEBAR_PERMISSIONS: Record<string, string | string[] | undefined> = {
  dashboard: undefined,
  merchants: 'merchants:read',
  payoutTransactions: ['payouts:read', 'merchant:payouts:read'],
  accountLedger: ['ledger:read', 'merchant:ledger:read'],
  scheduledPayouts: ['scheduled_payouts:read', 'merchant:scheduled_payouts:read'],
  beneficiaries: 'merchant:beneficiaries:read',
  depositTransactions: ['deposits:read', 'merchant:deposits:read'],
  roles: 'roles:read',
  users: 'users:read',
  auditLogs: 'audit_logs:read',
  walletAdjustments: 'wallets:adjust',
  generatedReports: 'reports:read',
  providers: 'providers:read',
  settings: undefined,
}

interface SidebarItemPermission {
  itemId: string
  requiredPermissions: string | string[] | undefined
  hasAccess: boolean
}

interface UseSidebarPermissionsResult {
  itemAccess: SidebarItemPermission[]
  visibleItems: string[]
  hasItemAccess: (itemId: string) => boolean
  isLoading: boolean
}

/**
 * Check if user has the required permission(s) for a sidebar item
 */
function checkPermissionAccess(
  requiredPermissions: string | string[] | undefined,
  userPermissionKeys: Set<string>,
  isMerchant: boolean,
): boolean {
  // No permission required - always accessible
  if (requiredPermissions === undefined) {
    return true
  }

  /** merchant:-prefixed permissions are only available to merchant users */
  const canUse = (key: string) => {
    if (key.startsWith('merchant:') && !isMerchant) return false
    return userPermissionKeys.has(key)
  }

  // Single permission required
  if (typeof requiredPermissions === 'string') {
    return canUse(requiredPermissions)
  }

  // Multiple permissions - user needs at least one (OR logic)
  return requiredPermissions.some(canUse)
}

export function useSidebarPermissions(): UseSidebarPermissionsResult {
  const { user } = useAuthStore()

  // Compute which sidebar items the user has access to
  const itemAccess = useMemo<SidebarItemPermission[]>(() => {
    const userPermissionKeys = new Set(user?.permissions ?? [])
    const isMerchant = user?.accountType === 'MERCHANT'

    return Object.entries(SIDEBAR_PERMISSIONS).map(([itemId, requiredPermissions]) => ({
      itemId,
      requiredPermissions,
      hasAccess: checkPermissionAccess(requiredPermissions, userPermissionKeys, isMerchant),
    }))
  }, [user?.permissions, user?.accountType])

  // Get list of visible item IDs
  const visibleItems = useMemo(
    () => itemAccess.filter(item => item.hasAccess).map(item => item.itemId),
    [itemAccess],
  )

  // Helper function to check if a specific item is accessible
  const hasItemAccess = useCallback(
    (itemId: string): boolean => {
      const item = itemAccess.find(i => i.itemId === itemId)
      return item?.hasAccess ?? false
    },
    [itemAccess],
  )

  return {
    itemAccess,
    visibleItems,
    hasItemAccess,
    isLoading: false,
  }
}
