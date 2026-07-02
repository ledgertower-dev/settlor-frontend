/**
 * Tab Permissions Hook
 *
 * Manages permission-based visibility for dashboard tabs
 * Reads permissions directly from the auth store (populated by /auth/me)
 */

import { useMemo, useCallback } from 'react'
import { useAuthStore } from '@/features/auth'

// Tab permission configuration
// Each tab maps to the permission required to view it
// undefined = always visible (no permission required)
const TAB_PERMISSIONS: Record<string, string | undefined> = {
  overview: undefined, // Always visible
  users: 'analytics:users:read',
  rbac: 'analytics:roles:read',
  security: 'analytics:security:read',
}

// All tab IDs in display order
const ALL_TABS = ['overview', 'users', 'rbac', 'security']

interface TabPermission {
  tabId: string
  requiredPermission: string | undefined
  hasAccess: boolean
}

interface UseTabPermissionsResult {
  tabAccess: TabPermission[]
  visibleTabs: string[]
  hasTabAccess: (tabId: string) => boolean
  isLoading: boolean
}

export function useTabPermissions(): UseTabPermissionsResult {
  const { user } = useAuthStore()

  // Compute which tabs the user has access to
  const tabAccess = useMemo<TabPermission[]>(() => {
    const userPermissionKeys = new Set(user?.permissions ?? [])

    return ALL_TABS.map(tabId => {
      const requiredPermission = TAB_PERMISSIONS[tabId]
      const hasAccess =
        requiredPermission === undefined || userPermissionKeys.has(requiredPermission)

      return {
        tabId,
        requiredPermission,
        hasAccess,
      }
    })
  }, [user?.permissions])

  // Get list of visible tab IDs
  const visibleTabs = useMemo(
    () => tabAccess.filter(tab => tab.hasAccess).map(tab => tab.tabId),
    [tabAccess],
  )

  // Helper function to check if a specific tab is accessible
  const hasTabAccess = useCallback(
    (tabId: string): boolean => {
      const tab = tabAccess.find(t => t.tabId === tabId)
      return tab?.hasAccess ?? false
    },
    [tabAccess],
  )

  return {
    tabAccess,
    visibleTabs,
    hasTabAccess,
    isLoading: false,
  }
}
